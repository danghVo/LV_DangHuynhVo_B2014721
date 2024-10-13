from pymongo import MongoClient
import os
from dotenv import load_dotenv

class MongoDBClient():
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(MongoDBClient, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        load_dotenv()

        user = os.getenv('MONGO_USER')
        pwd = os.getenv('MONGO_PASSWORD')
        host = os.getenv('MONGO_HOST') or "localhost:27017"

        # Provide the mongodb atlas url to connect python to mongodb using pymongo
        CONNECTION_STRING = "mongodb://{user}:{pwd}@{host}".format(user=user, pwd=pwd, host=host)

        self.client = MongoClient(CONNECTION_STRING)
        self.db = self.client["clustering"]
        self.collection = self.db["algorithms_results"]

    def insert(self, data):
        return self.collection.insert_one(data)

    def find(self, query):
        return self.collection.find(query)

    def find_one(self, query):
        return self.collection.find_one(query)

    def update(self, query, data):
        self.collection.update_one(query, data)

    def delete(self, query):
        self.collection.delete_one(query)