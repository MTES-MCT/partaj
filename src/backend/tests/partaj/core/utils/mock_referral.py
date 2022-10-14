from partaj.core import factories


def mock_create_referral(state, report, unit=None, askers=None):
    referral = factories.ReferralFactory(
        state=state,
        report=report
    )

    if unit:
        referral.units.set([unit])
    if askers:
        referral.users.set([
            asker.id
            for asker in askers
        ])

    return referral
