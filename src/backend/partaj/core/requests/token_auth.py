from django.conf import settings

import json
import requests


class TokenAuth:
    def __init__(self):
        self.__request_access_token()

    def get_token(self, refresh=None):
        if self.token is None:
            self.__request_access_token()

        if refresh is not None:
            self.__request_refresh_token()

        return self.token

    def __request_access_token(self):

        payload = {
            "login": settings.NOTIX_LOGIN,
            "password": settings.NOTIX_MDP,
        }
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content": "application/json",
        }
        returnData = requests.request(
            "POST",
            settings.NOTIX_SERVER_URL + "/auth",
            json=payload,
            headers=headers,
        )
        jsonData = returnData.json()
        self.token = jsonData["accessToken"]
        self.refreshToken = jsonData["refreshToken"]

    def __request_refresh_token(self):
        payload = {"refreshToken": self.refreshToken}
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content": "application/json",
        }
        returnData = requests.request(
            "POST",
            settings.NOTIX_SERVER_URL + "/auth",
            json=payload,
            headers=headers,
        )
        jsonData = returnData.json()
        self.token = jsonData["accessToken"]
        self.refreshToken = jsonData["refreshToken"]