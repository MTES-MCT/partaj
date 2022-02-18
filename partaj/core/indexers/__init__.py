"""
Indexing tooling and specialized classes matched with models to index.
"""
# flake8: noqa
from .common import *
from .referrals import ReferralsIndexer

ES_INDICES = [ReferralsIndexer]
