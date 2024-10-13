from valid.valid_request import valid_hierarchical_request
from loader.data_loader import DataLoader
from model.hierarchical import Hierarchical
from draw.hierarchical import draw_hierarchical
from utils.mongo_client import MongoDBClient
import json

def hierarchical(payload):
    try:
        if valid_hierarchical_request(payload):
            db = MongoDBClient()
            user_uuid = payload["userUuid"]

            link_method = payload["linkedMethod"]
            distance_type = payload["distanceType"]
            buffer = payload["buffer"]

            data_loader = DataLoader()

            df = data_loader.load_data(csv_file_buffer=buffer, process_categorical=True)

            hierarchical = Hierarchical(linked_method=link_method)

            hierarchical.fit(data=df, distance_type=distance_type, data_name=data_loader.data_name.copy())

            object_key = draw_hierarchical(hierarchical.iteration_data, data_loader.data_name, user_uuid)

            response = hierarchical.toJson(additionInfo={ "header": data_loader.header, "init_label": data_loader.data_name, "graph_key": object_key })

            db.insert({ "user_uuid": user_uuid, "data": json.loads(response)})

            return response
        else:
            return "Invalid parameter"
    except Exception as e:
        print(("Hierarchical handler error ", e))
        return "Internal server error"