DISTANCE_TYPE = ("euclidean", "manhattan")
LINK_METHOD = ("single", "complete", "average")

def valid_kmeans_request(payload):
    try:
        isValid = True

        print(type(payload))

        cluster = payload["cluster"]
        iteration = payload["iteration"]
        distance_type = payload["distanceType"]
        buffer = payload["buffer"]
        
        if distance_type not in DISTANCE_TYPE:
            print("distance_type not in DISTANCE_TYPE")
            isValid = False

        if not iteration.isdigit() or int(iteration) < 1:
            print("iteration not in DISTANCE_TYPE")
            isValid = False
        
        if not cluster.isdigit():
            print("cluster not in DISTANCE_TYPE")
            isValid = False

        if  not buffer:
            print("csv_file or buffer not in DISTANCE_TYPE")
            isValid = False

        return isValid
    except KeyError:
        print("KeyError")
        return False
    
def valid_hierarchical_request(payload):

    try:
        isValid = True

        link_method = payload["linkedMethod"]
        distance_type = payload["distanceType"]
        buffer = payload["buffer"]

        if link_method not in LINK_METHOD:
            isValid = False

        if distance_type not in DISTANCE_TYPE:
            isValid = False

        if not buffer:
            isValid = False

        return isValid
    except KeyError:
        print("KeyError")
        return False