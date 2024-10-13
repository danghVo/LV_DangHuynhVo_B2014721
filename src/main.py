import os
import redis
import time
import json
import base64

from handler.kmeans import kmeans as kmeans_handler
from handler.hierarchical import hierarchical as hierarchical_handler
from handler.get_user_results import get_user_results
from handler.delete_user_results import delete_user_results
from handler.elbow import elbow

port = int(os.environ.get("PORT", 5000))

REDIS_HOST = os.getenv("REDIS_HOST") or "localhost"
REDIS_PORT = 6379

if __name__ == "__main__":
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
    pub = r.pubsub()
    pub.subscribe("kmeans")
    pub.subscribe("hierarchical")

    print("Start listening to clustering channel")

    while True: 
        data = pub.get_message()
        if data: 
            message = data
            if message:
                if (message["channel"] == b"kmeans"):
                    print("Kmeans message received")

                    try:
                        if(type(message["data"]) == bytes):
                            payload = json.loads(message["data"])

                            response = kmeans_handler(payload)
                            print("Kmeans processed successfully")

                            # Publish response to channel
                            r.publish("kmeans response", base64.b64encode(response.encode("utf-8")))
                    except Exception as e:
                        print(e)
                        print("Kmeans processed unsuccessfully")

                        repsonse = json.dumps({ "error": "Internal server error" })
                        r.publish("kmeans response", base64.b64encode(repsonse))
                elif (message["channel"] == b"hierarchical"):
                    print("Hierarchical message received")

                    try:
                        if(type(message["data"]) == bytes):
                            payload = json.loads(message["data"])

                            response = hierarchical_handler(payload)
                            print("Hierarchical processed successfully")

                            # Publish response to channel
                            r.publish("hierarchical response", base64.b64encode(response.encode("utf-8")))
                    except Exception as e:
                        print(e)
                        print("Hierarchical processed unsuccessfully")

                        repsonse = json.dumps({ "error": "Internal server error" })
                        r.publish("hierarchical response", base64.b64encode(repsonse))
                elif (message["channel"] == b"get-user-results"):
                    print("Get user results message received")

                    try:
                        if(type(message["data"]) == bytes):
                            payload = json.loads(message["data"])

                            user_uuid = payload["userUuid"]
                            result_id = None

                            if("resultId" in payload):
                                result_id = payload["resultId"]

                            response = get_user_results(user_uuid, result_id)
                            print("Get user results processed successfully")

                            # Publish response to channel
                            r.publish("get-user-results response", base64.b64encode(response.encode("utf-8")))
                    except Exception as e:
                        print(e)
                        print("Get user results processed unsuccessfully")

                        repsonse = json.dumps({ "error": "Internal server error" })
                        r.publish("get-user-results response", base64.b64encode(repsonse))
                elif (message["channel"] == b"delete-user-results"):
                    print("Delete user results message received")

                    try:
                        if(type(message["data"]) == bytes):
                            payload = json.loads(message["data"])

                            user_uuid = payload["userUuid"]
                            result_id = None

                            if ("resultId" in payload):
                                result_id = payload["resultId"]

                            response = delete_user_results(user_uuid, result_id)
                            print("Delete user results processed successfully")

                            # Publish response to channel
                            r.publish("delete-user-results response", base64.b64encode(response.encode("utf-8")))
                    except Exception as e:
                        print(e)
                        print("Delete user results processed unsuccessfully")

                        repsonse = json.dumps({ "error": "Internal server error" })
                        r.publish("delete-user-results response", base64.b64encode(repsonse))
                elif (message["channel"] == b"kmeans-elbow"):
                    print("Kmeans elbow message received")

                    try:
                        if(type(message["data"]) == bytes):
                            payload = json.loads(message["data"])

                            response = elbow(payload)
                            print("Kmeans elbow processed successfully")

                            # Publish response to channel
                            r.publish("kmeans-elbow response", base64.b64encode(response.encode("utf-8")))
                    except Exception as e:
                        print(e)
                        print("Kmeans elbow processed unsuccessfully")

                        repsonse = json.dumps({ "error": "Internal server error" })
                        r.publish("kmeans-elbow response", base64.b64encode(repsonse))
        time.sleep(1)

