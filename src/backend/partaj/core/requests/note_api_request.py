from django.conf import settings

import requests

from ..requests.token_auth import TokenAuth
from ..transform_prosemirror_text import TransformProsemirrorText


class NoteApiRequest:
    def __init__(self):

        self._transform_mirror = TransformProsemirrorText()

        self._api_notix_end_points = {
            "Note": "/partaj/notice",
            "Topic": "/partaj-theme/notice",
            "Unit": "/partaj-service/notice",
            "User": "/partaj-annuaire/notice",
            "Upload": "/partaj/fields/note/upload",
        }
        self._notix_name = {"Topic": "nom", "Unit": "nom", "User": "nom"}

        self._token_auth = TokenAuth()
        self._token = self._token_auth.get_token()

        self._headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "Connection": "keep-alive",
            "Content-type": "application/json",
            "Authorization": "Bearer " + self._token,
        }

    def post_note(self, referral_answer):
        """
        Post Note to Notix
        """
        note = {
            "numero_saisine": [str(referral_answer.referral.id)],
            "service_demandeur": "",
            "objet": referral_answer.referral.object,
            "reponse": self._transform_mirror.referral_to_text(referral_answer.content),
            "theme": {},
            "unite_affectation": [],
            "charge_etude": [],
            "date_note": referral_answer.created_at.strftime("%Y-%m-%d"),
            "note": [],
        }

        if self._token is None:
            return False

        note["service_demandeur"] = referral_answer.referral.users.last().unit_name

        assignee_notix = self._get_object(
            referral_answer.referral.assignees.all().last()
        )

        assignee_notix["full"] = assignee_notix["nom"]
        note["charge_etude"].append(assignee_notix)

        topic_notix = self._get_object(referral_answer.referral.topic)
        assignee_notix["full"] = topic_notix["nom"]
        note["theme"] = topic_notix

        for assignee_unit in referral_answer.referral.units.all():
            unit_notix = self._get_object(assignee_unit)
            unit_notix["full"] = unit_notix["nom"]
            note["unite_affectation"].append(unit_notix)

        # Post the note
        return_data = self._call(
            "POST", settings.NOTIX_SERVER_URL + self._api_notix_end_points["Note"], note
        )

        return return_data

    def _get_object(self, partaj_object):
        """
        call get API to retrieve Notix referentiel object. Create or update it if necessary
        """
        # get notix object
        data = {
            "criterias": [
                {
                    "operator": "AND",
                    "field": "partaj_id",
                    "value": str(partaj_object.id),
                }
            ]
        }
        response = self._call(
            "POST",
            settings.NOTIX_SERVER_URL
            + self._api_notix_end_points[partaj_object.__class__.__name__]
            + "/search",
            data,
        )

        partaj_object_attribut_value = getattr(partaj_object, "get_note_value", None)()

        # if don't exist in Notix, create it
        if len(response["results"]) == 0:
            data = {
                self._notix_name[
                    partaj_object.__class__.__name__
                ]: partaj_object_attribut_value,
                "partaj_id": str(partaj_object.id),
            }
            notix_object = self._call(
                "POST",
                settings.NOTIX_SERVER_URL
                + self._api_notix_end_points[partaj_object.__class__.__name__],
                data,
            )

            return notix_object

        notix_object = response["results"][0]

        # patch if necessary
        patch_data = {}

        if (
            notix_object[self._notix_name[partaj_object.__class__.__name__]]
            != getattr(partaj_object, "get_note_value", None)()
        ):
            patch_data[self._notix_name[partaj_object.__class__.__name__]] = getattr(
                partaj_object, "get_note_value", None
            )()

        if notix_object["partaj_id"] != partaj_object.id:
            patch_data["partaj_id"] = str(partaj_object.id)

        if patch_data:
            notix_object = self._call(
                "PATCH",
                settings.NOTIX_SERVER_URL
                + self._api_notix_end_points[partaj_object.__class__.__name__]
                + "/"
                + notix_object.get("id"),
                patch_data,
            )

        return notix_object

    def _call(self, type_api, end_point, data):
        """
        generic method to call  api to notix
        """

        response = requests.request(
            type_api, end_point, headers=self._headers, json=data
        )

        if response.status_code in (401, 403):
            self._token = self._token_auth.get_token(True)
            self._headers["Authorization"] = "Bearer " + self._token
            response = requests.request(
                type_api, end_point, headers=self._headers, json=data
            )
            if response.status_code not in (200, 201):
                print("***************************")
                print(response.status_code)
                print(end_point)
                print(data)
                print(response.json())
                print("***************************")
                raise ValueError(response)
            else:
                return response.json()

        if response.status_code not in (200, 201):
            print("***************************")
            print(response.status_code)
            print(end_point)
            print(data)
            print(response.json())
            print("***************************")
            raise ValueError(response)
        else:
            return response.json()