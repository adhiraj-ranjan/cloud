import firebase_admin
from firebase_admin import credentials, db
from json import loads
from os import environ
from base64 import b64decode

token = "ew0KICAidHlwZSI6ICJzZXJ2aWNlX2FjY291bnQiLA0KICAicHJvamVjdF9pZCI6ICJ0ZWxlZ3JhbS1jbG91ZC1zZXNzaW9uIiwNCiAgInByaXZhdGVfa2V5X2lkIjogImIyNzUwMGFhZjA2ZWQ2MjE0MmFkNGE5YmYyOWNkNjRlN2QzOGMxYWUiLA0KICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdkFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLWXdnZ1NpQWdFQUFvSUJBUUNpNzlibTk1K0Z2KzE5XG5KRFFzT3Y2TXlwRk1qUE0xcVZqcUhGbjVldGNKazBYY3VkVG5VeFNSc1AzanFaVWRQaEIvaG9KQVBjNFE2U1BGXG5VZDQ5SzV3MWpnejYrU2pqTVNJOTZha3hxR09XQ1dsUWZpNVVzbGt5ME8vWnpNSnp2ektWRDRVeWNLejU2SW1nXG5tOGpCMjd3d2gxMmRuNnhSaStJYlRLN09PbVdHWktld1lvTTJBS3pKeisvOWFEN2FsTXpLa29jZ2JlQXhMQm9MXG5rbGk0L3UwYm1YanRBcUEwUjUyRlVkNkpnQWtjK1NQN2lxMXg2TVVVeWlQVWZtZ3cwNEhvVU1CeHFYbVVxVXRPXG5IWTZwRUs3TUlxbThPbThUTkJoN2ErOXJqSGJiM3VLdjlyWE9FbXZOQTlUaERtQWd0TWF5K0daRHNsVktaTDBGXG5PdGRCUXlsaEFnTUJBQUVDZ2dFQUc0LzdXRUJZdTZFakxUbG4ydmlTMFdHOThRZGg1L2l3K2c5WU9BL3IydXFQXG5GWjdZOFZXNFE4bi9OTmtkeUovVVhpSTBtK1hvbXlzNUdocTJmNzRHRTNnbllYZ3ZEcm1qeTNuZ25XNFpCSXNzXG5oY21Ha0Z6SUlvUytJaWVWV0V1bVpKbEd4S2pUVmdZY2ErOFdaNWJDYjZvaWI3VFFTMDRncmxJTE93Y2RYLzJYXG5LTDBNYTVqNzNkVW5oVzJ2MnZnWGdhQ2N6dVA4RGRqMkI4dGFTMVBlMnlLQ1hNczhITHNzMTJGSjhwUlJIR0QrXG5Jb1NlMlhlbGF5Tkd1U3R1VVlxbjl0NFdjVUlBSU9UTEVDNHlCWnNTenBKNGVzazE2dnZjZFlSOHJQeEZFcTVPXG40RXRvS2Q0MEZaeVY2UytZZzhkRDlUeWtWekNjMWRQUG4xYlhkdU1RelFLQmdRRGJ3eHl1cDFoNkx0dzI3RU5pXG56WEhCdW91TWFNUFVOTFVMZ09JTzMyRlN6R2xVRXhDeDFEWEI5T05kNGFIQUN0SzQvR1VEM1k0TmJlR29nR1hqXG5DMU9DcGlWU1J1WU9QUmtHS2FXM2pFRDd3YzNqUVIzY3lXODB0NVdOYTFEWWtUelJxZGxUeHEvTjJpQkVXczdsXG4vNmt6WFlWbllDcEFFYVFEZXJZVVJWeDhiUUtCZ1FDOXpmR3lxcmN5VUtwcEJnZzJyVDZDNWNSS3lDMzRoaGRQXG5YWjlHRFpkWE4yT3lONkdudHk2bFFkQWsxYkw3OGl2bTQ1VFJOV1BWNE5GS0ZMd0ZXNXEyeWw1dXcrV21TVFZIXG5Rd0E1L3VOYU53Tk5DcXNKV3hsR0ZKLzM5dkNUS0I2YXRLRVpTS083RnNaMC9MSk9xdTQrWDZ1MC9scUhPZ1Q5XG5uS0tGRWVnZ1JRS0JnQWpoSVUrTlEyM3Nac2x4VW1lemxWMFdoSHp2M3JtOFIzUm5pTHJCRzlXVW5NemcyRlBYXG5GelQzQ0JqSy9SWWRXZFpQbkdWRGxuSEVkdEd3SG0zR0QySEFCTklHTzFWbjhwTGxLK1QycmNsK1V5dFRmamxsXG5pakMvR2pQVW1qZWw1cWN5RGEzczRUMllDcVc0WlpPMWVNaXlocWxlb1ZabFlCTWo2aWQzaGYwaEFvR0FYdzBuXG5vVVlGQUZtTlBaTWJ3ZVg0akN6c3BGYWpUdlkzN2pNQWRHQ1NEY2RiVWdDeUgvK0lpSkh3M3NGMkpONGVSajVxXG5aR3JNV0d1QjVBdUdMVmkybmh1eU50NDd2NDZoODlJRjV3VlNiZmRtMjhvZjVVdU4ySjZ6amNaSXJDbEhTa3B5XG44dXFCdEV1dmp4Nk5YUUFVMTMrcHliWW5OOWxDYm85bWhDVjNqZEVDZ1lBQTRtT1JEdVFUcEppVStkRjBDRWtZXG5SK3BmcGRZWjNiVlVEM0VpVE4vNWNXTENUSk5WVGhrdTRWTVNUb05oMWtmajdNQzQxVnFxNU5aMGNjMlVjdDdRXG4zbTRCNm9ZczFtVnlXTDFKSTZNVm1PdlhPVUROMU9vaXlQU1dTUldGWnhhUEZlZ2VuUnNtZlNxc1hqTWQrRGREXG5QeFowRjJrTTdnZEF0UlJZdHpGYjJnPT1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsDQogICJjbGllbnRfZW1haWwiOiAiZmlyZWJhc2UtYWRtaW5zZGstbnkwZjNAdGVsZWdyYW0tY2xvdWQtc2Vzc2lvbi5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsDQogICJjbGllbnRfaWQiOiAiMTAwNjg3MDAwNDA5ODY4MTkxMjI2IiwNCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwNCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsDQogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwNCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstbnkwZjMlNDB0ZWxlZ3JhbS1jbG91ZC1zZXNzaW9uLmlhbS5nc2VydmljZWFjY291bnQuY29tIg0KfQ0K"
CREDS = loads(b64decode(token).decode())

cred = credentials.Certificate(CREDS)
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://telegram-cloud-session-default-rtdb.asia-southeast1.firebasedatabase.app/"
})

route = db.reference("sessions/")

def add_session(key, sessionString):
    print(key, sessionString)
    route.update({key: sessionString})

def get_session(key):
    return route.child(key).get()

def delete_session(key):
    route.child(key).delete()

