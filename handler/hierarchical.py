from valid.valid_request import valid_hierarchical_request
from data.data_loader import DataLoader
from model.hierarchical import Hierarchical
from draw.hierarchical import draw_hierarchical

def hierarchical(payload):
    try:
        if valid_hierarchical_request(payload):
            link_method = payload["linkedMethod"]
            distance_type = payload["distanceType"]
            buffer = payload["buffer"]

            data_loader = DataLoader()

            df = data_loader.load_data(csv_file_buffer=buffer)

            hierarchical = Hierarchical(linked_method=link_method)

            hierarchical.fit(data=df, distance_type=distance_type, data_name=data_loader.data_name)

            print(hierarchical.getGraphData())

            # draw_hierarchical(*hierarchical.getGraphData())

            return hierarchical.toJson(additionInfo={ "header": data_loader.header, "data_name": data_loader.data_name })
        else:
            return "Invalid parameter"
    except Exception as e:
        print(e)
        return "Internal server error"