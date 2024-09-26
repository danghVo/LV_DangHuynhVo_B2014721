import os
import redis
import time
import json
import base64

from handler.kmeans import kmeans as kmeans_handler
from handler.hierarchical import hierarchical as hierarchical_handler

port = int(os.environ.get("PORT", 5000))

REDIS_HOST = "localhost"
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
                if(message["channel"] == b"kmeans"):
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
                elif(message["channel"] == b"hierarchical"):
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
            
        time.sleep(1)

