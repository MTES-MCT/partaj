# pylint: disable=too-many-locals, unused-variable, too-many-branches, too-many-statements, invalid-name
"""
Management command to reset the database and seed it with demo data.

Actions performed:
- Flush all database data.
- Create 5 Units and 3 Topics (topics linked to the first 3 units).
- For each Unit, create 3 users and memberships with roles: OWNER, ADMIN, MEMBER.
- Create 5 requester users ("demandeurs").
- Create referrals only for demandeurs: 40 per demandeur (total 200), with different states.

Usage:
    python manage.py seed_demo

Note:
- This command is intended for local/dev environments.
- To avoid Elasticsearch side effects, referrals are created via bulk_create and
  M2M relations are set using through models with bulk_create as well (so the
  Referral.save() override does not trigger indexing).
"""
from __future__ import annotations

import os
import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from sentry_sdk import capture_message

from partaj.core.models import (
    Referral,
    ReferralReport,
    ReferralState,
    ReferralStatus,
    ReferralUnitAssignment,
    ReferralUrgency,
    ReferralUserLink,
    ReferralUserLinkRoles,
    Topic,
    Unit,
    UnitMembership,
    UnitMembershipRole,
)


class Command(BaseCommand):
    """
    Fixtures data management command.
    """

    help = (
        "Flush database and seed fixtures data: 5 units, 3 topics, memberships, 5 requesters, "
        "and 40 referrals per requester (only) across varied states (total 200)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-flush",
            action="store_true",
            help="Do not flush the database before seeding (use existing data).",
        )

    def handle(self, *args, **options):

        if os.environ.get("DJANGO_CONFIGURATION") != "Development":
            self.stdout.write(
                self.style.WARNING(
                    "Operation aborted : This command can only be run in a Dev env."
                )
            )
            capture_message(
                f"Unable to run {self.__class__.__name__} command in non-Dev envs.",
                "error",
            )

        no_flush = options.get("no_flush")

        if not no_flush:
            self.stdout.write(self.style.WARNING("Flushing database..."))
            call_command("flush", interactive=False)

        # Create superuser from environment variables (same approach as 0002_createsuperuser)
        try:
            User = get_user_model()
            username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
            email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
            password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

            if username and email and password:
                if not User.objects.filter(username=username).exists():
                    su = User(
                        email=email,
                        is_staff=True,
                        is_superuser=True,
                        username=username,
                    )
                    su.password = make_password(password)
                    su.save()
                    self.stdout.write(
                        self.style.SUCCESS(f"Superuser '{username}' created.")
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f"Superuser '{username}' already exists.")
                    )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        "DJANGO_SUPERUSER_* env vars not set; skipping superuser creation."
                    )
                )
        except Exception as e:  # pylint: disable=broad-except
            self.stdout.write(self.style.ERROR(f"Failed to create superuser: {e}"))

        self.stdout.write(self.style.SUCCESS("Seeding demo data..."))

        # 1) Create Units
        units: list[Unit] = []

        for i in range(1, 6):
            unit = Unit(name=f"Unit {i}")
            units.append(unit)

        Unit.objects.bulk_create(units)

        units = list(Unit.objects.order_by("created_at").all())

        # 2) Create Topics (3 topics linked to the first 3 units)
        topics: list[Topic] = []

        for i in range(1, 4):
            topics.append(Topic(name=f"Topic {i}", unit=units[i - 1], path=""))

        Topic.objects.bulk_create(topics)

        # Build materialized paths (bulk_create won't trigger save())
        Topic.objects.build_materialized_paths()
        topics = list(Topic.objects.order_by("created_at").all())

        # Ensure referral urgencies exist
        urgencies = list(ReferralUrgency.objects.order_by("index").all())
        if not urgencies:
            default_urgencies = [
                ReferralUrgency(
                    name="Normal",
                    index=0,
                    duration=timedelta(days=30),
                    requires_justification=False,
                ),
                ReferralUrgency(
                    name="Urgent",
                    index=1,
                    duration=timedelta(days=10),
                    requires_justification=True,
                ),
                ReferralUrgency(
                    name="Very urgent",
                    index=2,
                    duration=timedelta(days=3),
                    requires_justification=True,
                ),
            ]
            ReferralUrgency.objects.bulk_create(default_urgencies)
            urgencies = list(ReferralUrgency.objects.order_by("index").all())

        # 3) Create Unit Members with roles per unit
        User = get_user_model()
        created_users: list[User] = []

        roles_order = [
            UnitMembershipRole.OWNER,
            UnitMembershipRole.ADMIN,
            UnitMembershipRole.MEMBER,
        ]

        for unit_idx, unit in enumerate(units, start=1):
            for r_idx, role in enumerate(roles_order, start=1):
                username = f"unit{unit_idx}_{role}"
                user = User(
                    username=username,
                    email=f"{username}@example.com",
                    first_name=f"{role.title()}",
                    last_name=f"U{unit_idx}",
                    unit_name=f"UNIT/{unit_idx}",
                    is_staff=False,
                )
                user.set_password("password")
                created_users.append(user)

        User.objects.bulk_create(created_users)

        # Refresh created users from DB (IDs set) and keep a deterministic order per unit/role
        expected_usernames = []
        for unit_idx in range(1, len(units) + 1):
            for role in roles_order:
                expected_usernames.append(f"unit{unit_idx}_{role}")
        users_qs = User.objects.filter(username__in=expected_usernames)
        user_by_name = {u.username: u for u in users_qs}
        created_users = [user_by_name[name] for name in expected_usernames]

        # Build memberships (link each 3 users to their unit with role)
        memberships: list[UnitMembership] = []
        cu_iter = iter(created_users)
        for unit in units:
            for role in roles_order:
                user = next(cu_iter)
                memberships.append(UnitMembership(user=user, unit=unit, role=role))
        UnitMembership.objects.bulk_create(memberships)

        # 4) Create 5 requester users (requesters)
        requesters: list[User] = []
        for i in range(1, 6):
            username = f"requester{i}"
            u = User(
                username=username,
                email=f"{username}@example.com",
                first_name="requester",
                last_name=str(i),
                unit_name="",
                is_staff=False,
            )
            u.set_password("password")
            requesters.append(u)
        User.objects.bulk_create(requesters)
        requesters = list(User.objects.filter(username__startswith="requester").all())

        # Use only requesters as requesters for referrals
        referral_requesters = requesters
        REFERRALS_PER_REQUESTER = 40

        # 5) Create referrals for requesters only (40 per requester = 200 total) with varied states
        states_cycle = [
            ReferralState.DRAFT,
            ReferralState.RECEIVED,
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
            ReferralState.ANSWERED,
            ReferralState.CLOSED,
        ]

        # Prepare referrals (bulk_create)
        referrals_to_create: list[Referral] = []
        now = timezone.now()
        for user in referral_requesters:
            for j in range(REFERRALS_PER_REQUESTER):
                state = states_cycle[j % len(states_cycle)]
                topic = random.choice(topics) if topics else None
                title = f"Referral {user.username} #{j+1}"
                # sent_at for all (even drafts, for simplicity)
                sent_at = now - timedelta(days=random.randint(0, 30))
                r = Referral(
                    title=title,
                    object=f"Object for {title}",
                    question=f"Question for {title}",
                    context=f"Context for {title}",
                    prior_work=f"Prior work for {title}",
                    topic=topic,
                    state=state,
                    status=ReferralStatus.NORMAL,
                    urgency_level=random.choice(urgencies),
                    sent_at=sent_at,
                )
                referrals_to_create.append(r)
        Referral.objects.bulk_create(referrals_to_create)

        # Reload referrals with IDs
        all_referrals = list(Referral.objects.order_by("id").all())

        # Create and attach an empty report to each non-draft referral
        non_draft_refs = [r for r in all_referrals if r.state != ReferralState.DRAFT]
        if non_draft_refs:
            reports = [ReferralReport() for _ in non_draft_refs]
            ReferralReport.objects.bulk_create(reports)
            for ref, rep in zip(non_draft_refs, reports):
                ref.report = rep
            Referral.objects.bulk_update(
                non_draft_refs, ["report"]
            )  # avoid save() side effects

        # Build links: requester links and unit assignments (through models)
        links: list[ReferralUserLink] = []
        assignments: list[ReferralUnitAssignment] = []

        ref_iter = iter(all_referrals)
        for user in referral_requesters:
            for j in range(REFERRALS_PER_REQUESTER):
                referral = next(ref_iter)
                links.append(
                    ReferralUserLink(
                        user=user,
                        referral=referral,
                        role=ReferralUserLinkRoles.REQUESTER,
                    )
                )
                # Assign to the topic's unit if available, otherwise pick a random unit
                unit = (
                    referral.topic.unit
                    if referral.topic and referral.topic.unit
                    else random.choice(units)
                )
                assignments.append(
                    ReferralUnitAssignment(
                        unit=unit,
                        referral=referral,
                    )
                )
        ReferralUserLink.objects.bulk_create(links)
        ReferralUnitAssignment.objects.bulk_create(assignments)

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self.stdout.write(
            self.style.SUCCESS(
                f"Created: {len(units)} units, {len(topics)} topics, "
                f"{len(created_users)} unit members, {len(requesters)} requesters, "
                f"{len(all_referrals)} referrals."
            )
        )
