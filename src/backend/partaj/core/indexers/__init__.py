"""
Indexing tooling and specialized classes matched with models to index.
"""
# flake8: noqa
from .common import *
from .notes import NotesIndexer
from .referrals import ReferralsIndexer
from .topics import TopicsIndexer
from .units import UnitsIndexer
from .users import UsersIndexer

ES_INDICES = [ReferralsIndexer, TopicsIndexer, UnitsIndexer, UsersIndexer]
