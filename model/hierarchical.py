import json
from utils.distance_utils import Distance
from utils.json_encoder import json_encoder


class Hierarchical: 
    def __init__(self, linked_method):
        self.linked_method = linked_method

    def distance(self, distance_type, a, b):
        distanceFormula = Distance(distance_type).calculate

        if(isinstance(a[0], list) == False):
            a = [a]

        if(isinstance(b[0], list) == False):
            b = [b]

        if self.linked_method == 'single':
            return min(distanceFormula(x, y) for x, y in zip(a, b))
        elif self.linked_method == 'complete':
            return max(distanceFormula(x, y) for x, y in zip(a, b))
        elif self.linked_method == 'average':
            return sum(distanceFormula(x, y) for x, y in zip(a, b)) / len(b)

    def fit(self, data, distance_type, data_name):
        # Random centroid
        clusters = len(data)
        labels = []
        self.iteration_data = []
        data_values = data.values.tolist()
        data_name = data_name.tolist()

        while clusters > 1:
            min_distance = float('inf')
            min_index = (0, 0)
            distances_matrix = []

            for i in range(clusters):
                for j in range(i+1, clusters):
                    distance = self.distance(distance_type, data_values[i], data_values[j])
                    distances_matrix.append({
                        "distance": distance,
                        "cluster1": data_name[i],
                        "cluster2": data_name[j],
                    })

                    if distance < min_distance:
                        min_distance = distance
                        min_index = (i, j)

            new_cluster = []
            if isinstance(data_values[min_index[0]][0], list):
                new_cluster.extend(data_values[min_index[0]])
            else: new_cluster.append(data_values[min_index[0]])

            if isinstance(data_values[min_index[1]][0], list):
                new_cluster.extend(data_values[min_index[1]])
            else: new_cluster.append(data_values[min_index[1]])

            new_cluster_name = data_name[min_index[0]] + "-" + data_name[min_index[1]]

            data_values.pop(min_index[1])
            data_values.pop(min_index[0])
            data_values.append(new_cluster)

            data_name.pop(min_index[1])
            data_name.pop(min_index[0])
            data_name.append(new_cluster_name)

            clusters -= 1

            data_values_snapshot = data_values.copy()
            data_name_snapshot = data_name.copy()
            self.iteration_data.append({
                "iteration": len(self.iteration_data) + 1,
                "distance_matrix": distances_matrix,
                "cluster_data": data_values_snapshot,
                "cluster_name": data_name_snapshot
            })

        self.labels = labels

    def toJson(self, additionInfo = {}):
        """ Convert the clustering data trained to json format

            Returns:
                The json format of clustering iteration data
        """

        clusteringData = {
            "algorithm": "hierarchical",
            "link_method": self.linked_method,
            "iteration_data": self.iteration_data,    
            **additionInfo
        }

        return json.dumps(clusteringData, cls=json_encoder)