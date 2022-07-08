import uuid

from django.conf import settings

import requests

from ..requests.token_auth import TokenAuth


class NoteApiRequest:
    def __init__(self):
        self._note = {
            "numero_saisine": ["0006"],
            "service_demandeur": {
                "full": "AJAG/AJAG1-2",
                "id": 15,
                "_baseIdentifier": "partaj-service",
                "nom": "AJAG/AJAG1-2",
            },
            "objet": str(uuid.uuid4()),
            "reponse": "reponse",
            "theme": {
                "full": "Droit du numérique",
                "id": 12,
                "_baseIdentifier": "partaj-theme",
                "theme": "Droit du numérique",
            },
            "unite_affectation": {
                "full": "AJAG/AJAG5",
                "id": 12,
                "_baseIdentifier": "partaj-service",
                "nom": "AJAG/AJAG5",
            },
            "charge_etude": {
                "full": "GRAVIER Matthieu",
                "id": 5,
                "_baseIdentifier": "partaj-annuaire",
                "nom": "GRAVIER Matthieu",
            },
            "note": [],
        }

    def post_note(self):
        """
        Post Note to Notix
        """
        token_auth = TokenAuth()
        token = token_auth.get_token()

        if token is None:
            return None

        return_code = self._post(token)
        if return_code == 403:
            token = token_auth.get_token(True)
            return_code = self._post(token)
        return return_code

    def _post(self, token):
        """
        Post note to notix
        """

        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "Connection": "keep-alive",
            "Content-type": "application/json",
            "Authorization": "Bearer " + token,
        }

        return_data = requests.request(
            "POST",
            settings.NOTIX_SERVER_URL + "/partaj/notice",
            json=self._note,
            headers=headers,
        )

        return return_data.status_code
