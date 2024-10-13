from utils.mongo_client import MongoDBClient
import json

def delete_user_results(user_uuid, result_id):
    try:
        db = MongoDBClient()
        query = { "user_uuid": user_uuid}

        if (result_id):
            query["_id"] = result_id
        
        data = db.delete(query)
        return json.dumps(data)
    except Exception as e:
        print(("Get user results handler error ", e))
        return "Internal server error"