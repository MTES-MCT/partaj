"""
Helpers for Elasticsearch indices management.
"""
import re
from functools import reduce

from django.conf import settings
from django.utils import timezone

from elasticsearch.exceptions import NotFoundError, RequestError

from partaj.core.indexers import NotesIndexer

from .indexers import ANALYSIS_SETTINGS, ES_INDICES, ES_INDICES_CLIENT
from .indexers.common import partaj_bulk


def get_indices_by_alias(existing_indices, alias):
    """
    Get existing indices for an alias. Support multiple existing aliases so the command
    always 'cleans up' the aliases even if they got messed up somehow.
    """
    for index, details in existing_indices.items():
        if alias in details.get("aliases", {}):
            yield index, alias


def perform_create_index(indexable, logger=None):
    """
    Create a new index in ElasticSearch from an indexable instance.
    """
    # Create a new index name, suffixing its name with a timestamp
    new_index = f"{indexable.index_name:s}_{timezone.now():%Y-%m-%d-%Hh%Mm%S.%fs}"

    # Create the new index
    if logger:
        logger.info(f'Creating a new Elasticsearch index "{new_index:s}"...')
    ES_INDICES_CLIENT.create(index=new_index)

    # The index needs to be closed before we set an analyzer
    ES_INDICES_CLIENT.close(index=new_index)
    ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index=new_index)
    ES_INDICES_CLIENT.open(index=new_index)

    ES_INDICES_CLIENT.put_mapping(body=indexable.mapping, index=new_index)

    # Populate the new index with data provided from our indexable class
    partaj_bulk(indexable.get_es_documents(new_index))

    # Return the name of the index we just created in ElasticSearch
    return new_index


def regenerate_indices(logger=None):
    """
    Create new indices for our indexables and replace possible existing indices with
    a new one only once it has successfully built it.
    """
    # Get all existing indices once; we'll look up into this list many times
    try:
        existing_indices = ES_INDICES_CLIENT.get_alias("*")
    except NotFoundError:
        # Provide a fallback empty list so we don't have to check for its existence later on
        existing_indices = []

    # Create a new index for each of those modules
    # NB: we're mapping perform_create_index which produces side-effects
    indices_to_create = zip(
        list(map(lambda ix: perform_create_index(ix, logger), ES_INDICES)), ES_INDICES
    )

    # Prepare to alias them so they can be swapped-in for the previous versions
    actions_to_create_aliases = [
        {"add": {"index": index, "alias": ix.index_name}}
        for index, ix in indices_to_create
    ]

    # Get the previous indices for every alias
    indices_to_unalias = reduce(
        lambda acc, ix: acc
        + list(get_indices_by_alias(existing_indices, ix.index_name)),
        ES_INDICES,
        [],
    )

    # Prepare to un-alias them so they can be swapped-out for the new versions
    # NB: use chain to flatten the list of generators
    actions_to_delete_aliases = [
        {"remove": {"index": index, "alias": alias}}
        for index, alias in indices_to_unalias
    ]

    # Identify orphaned indices that belong to our own app.
    # NB: we *must* do this before the update_aliases call so we don't immediately prune
    # version n-1 of all our indices
    useless_indices = [
        index
        for index, details in existing_indices.items()
        if index.startswith(str(settings.ELASTICSEARCH["INDICES_PREFIX"]))
        and not details["aliases"]
    ]

    # Replace the old indices with the new ones in 1 atomic operation to avoid outage
    def perform_aliases_update():
        try:
            ES_INDICES_CLIENT.update_aliases(
                dict(actions=actions_to_create_aliases + actions_to_delete_aliases)
            )
        except RequestError as exception:
            # This operation can fail if an index exists with the same name as an alias we're
            # attempting to create. In our case, this is not supposed to happen and is usually
            # the result of a broken ES state.
            if exception.error == "invalid_alias_name_exception":
                # We have to extract the name of the broken index from a string
                pattern = re.compile(r"Invalid alias name \[(.*)\].*")
                broken_index = pattern.match(exception.info["error"]["reason"]).group(1)
                # Delete it (it was unusable and we can recreate its data at-will)
                ES_INDICES_CLIENT.delete(index=broken_index)
                # Attempt to perform the operation again
                # We're doing this recursively in case more than one such broken indices existed
                perform_aliases_update()
            # Let other kinds of errors be raised
            else:
                raise exception

    perform_aliases_update()

    for useless_index in useless_indices:
        # Disable keyword arguments checking as elasticsearch-py uses a decorator to list
        # valid query parameters and inject them as kwargs. I won't say a word about this
        # anti-pattern.
        #
        # pylint: disable=unexpected-keyword-arg
        ES_INDICES_CLIENT.delete(index=useless_index, ignore=[400, 404])


def regenerate_index(logger=None):
    """
    Create new index for our indexable and replace possible existing index with
    a new one only once it has successfully built it.
    """
    # Get all existing indices once; we'll look up into this list many times
    try:
        existing_indices = ES_INDICES_CLIENT.get_alias(NotesIndexer.index_name)
    except NotFoundError:
        # Provide a fallback empty list so we don't have to check for its existence later on
        existing_indices = []

    # Create a new index for each of those modules
    # NB: we're mapping perform_create_index which produces side-effects
    indices_to_create = zip(
        list(map(lambda ix: perform_create_index(ix, logger), [NotesIndexer])),
        [NotesIndexer],
    )

    # Prepare to alias them so they can be swapped-in for the previous versions
    actions_to_create_aliases = [
        {"add": {"index": index, "alias": ix.index_name}}
        for index, ix in indices_to_create
    ]

    # Get the previous indices for every alias
    indices_to_unalias = reduce(
        lambda acc, ix: acc
        + list(get_indices_by_alias(existing_indices, ix.index_name)),
        [NotesIndexer],
        [],
    )

    # Prepare to un-alias them so they can be swapped-out for the new versions
    # NB: use chain to flatten the list of generators
    actions_to_delete_aliases = [
        {"remove": {"index": index, "alias": alias}}
        for index, alias in indices_to_unalias
    ]

    # Identify orphaned indices that belong to our own app.
    # NB: we *must* do this before the update_aliases call so we don't immediately prune
    # version n-1 of all our indices
    useless_indices = [
        index
        for index, details in existing_indices.items()
        if index.startswith(str(settings.ELASTICSEARCH["INDICES_PREFIX"]))
        and not details["aliases"]
    ]

    # Replace the old indices with the new ones in 1 atomic operation to avoid outage
    def perform_aliases_update():
        try:
            ES_INDICES_CLIENT.update_aliases(
                dict(actions=actions_to_create_aliases + actions_to_delete_aliases)
            )
        except RequestError as exception:
            # This operation can fail if an index exists with the same name as an alias we're
            # attempting to create. In our case, this is not supposed to happen and is usually
            # the result of a broken ES state.
            if exception.error == "invalid_alias_name_exception":
                # We have to extract the name of the broken index from a string
                pattern = re.compile(r"Invalid alias name \[(.*)\].*")
                broken_index = pattern.match(exception.info["error"]["reason"]).group(1)
                # Delete it (it was unusable and we can recreate its data at-will)
                ES_INDICES_CLIENT.delete(index=broken_index)
                # Attempt to perform the operation again
                # We're doing this recursively in case more than one such broken indices existed
                perform_aliases_update()
            # Let other kinds of errors be raised
            else:
                raise exception

    perform_aliases_update()

    for useless_index in useless_indices:
        # Disable keyword arguments checking as elasticsearch-py uses a decorator to list
        # valid query parameters and inject them as kwargs. I won't say a word about this
        # anti-pattern.
        #
        # pylint: disable=unexpected-keyword-arg
        ES_INDICES_CLIENT.delete(index=useless_index, ignore=[400, 404])
