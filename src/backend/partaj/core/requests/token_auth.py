from django.conf import settings

import requests

from .. import models


class TokenAuth:
    """
    Authentication token for external API access
    """

    def __init__(self):
        self._headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept_Language": "fr_FR,fr;q=0.9,en_US;q=0.8,en;q=0.7",
            "Content": "application/json",
        }

    def get_token(self, refresh=None):
        """
        Returns  access token
        """

        token = None
        try:
            token = models.Token.objects.latest("updated_at")

        except models.Token.DoesNotExist:
            token_list = self._request_access_token()
            if token_list is not None:
                token = models.Token.objects.create(
                    access_token=token_list["accessToken"],
                    refresh_token=token_list["refreshToken"],
                )

        if refresh is not None:
            token_list = self._request_refresh_token(token.refresh_token)
            if token_list is not None:
                token.access_token = token_list["accessToken"]
                token.refresh_token = token_list["refreshToken"]
                token.save()

        if token is not None:
            return token.access_token

    def _request_access_token(self):
        """
        Requests  acces token
        """

        payload = {
            "login": settings.NOTIX_LOGIN,
            "password": settings.NOTIX_MDP.replace(r"\*", "*"),
        }
        returnData = requests.request(
            "POST",
            settings.NOTIX_SERVER_URL + "/auth",
            json=payload,
            headers=self._headers,
        )
        if returnData.status_code == 200:
            jsonData = returnData.json()
            return jsonData

    def _request_refresh_token(self, refresh_token):
        """
        Requests  access token with refresh token
        """
        payload = {"refreshToken": refresh_token}

        returnData = requests.request(
            "POST",
            settings.NOTIX_SERVER_URL + "/auth",
            json=payload,
            headers=self._headers,
        )
        if returnData.status_code == 200:
            jsonData = returnData.json()
            return jsonData
