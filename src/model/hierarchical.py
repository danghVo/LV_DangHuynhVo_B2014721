import json
from utils.distance_utils import Distance
from utils.json_encoder import json_encoder

'''
Cluster type:
    - point: string[]
    - name: string

Iteration:
    - 
'''


class Hierarchical: 
    def __init__(self, linked_method):
        self.linked_method = linked_method

    def distance(self, distance_type, a, b):
        distanceFormula = Distance(distance_type).calculate

        if(not isinstance(a[0], list)):
            a = [a]

        if(not isinstance(b[0], list)):
            b = [b]

        if self.linked_method == 'single':
            return min(distanceFormula(x, y) for x in a for y in b)
        elif self.linked_method == 'complete':
            return max(distanceFormula(x, y) for x in a for y in b)
        elif self.linked_method == 'average':
            return sum(distanceFormula(x, y) for x in a for y in b) / (len(a) * len(b))
        elif self.linked_method == 'centroid':
            centroid_a = [sum(x) / len(x) for x in zip(*a)]
            centroid_b = [sum(x) / len(x) for x in zip(*b)]
            return distanceFormula(centroid_a, centroid_b)

    def fit(self, data, distance_type, data_name):
        # Random centroid
        clusters = len(data)
        self.iteration_data = []
        data_values = data.values.tolist()
        labels = data_name.copy()

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

            # Get new cluster created
            new_cluster = []
            if isinstance(data_values[min_index[0]][0], list):
                new_cluster.extend(data_values[min_index[0]])
            else: new_cluster.append(data_values[min_index[0]])

            if isinstance(data_values[min_index[1]][0], list):
                new_cluster.extend(data_values[min_index[1]])
            else: new_cluster.append(data_values[min_index[1]])

            new_cluster_name = data_name[min_index[0]] + "-" + data_name[min_index[1]]

            labels.append(new_cluster_name)
            # New cluster data
            index_cluster_1 = labels.index(data_name[min_index[0]])
            index_cluster_2 = labels.index(data_name[min_index[1]])
            total_point = len(labels[index_cluster_1].split('-')) + len(labels[index_cluster_2].split('-'))

            # Update cluster data
            data_values.pop(min_index[1])
            data_values.pop(min_index[0])
            data_values.append(new_cluster)

            # Update cluster name
            data_name.pop(min_index[1])
            data_name.pop(min_index[0])
            data_name.append(new_cluster_name)

            clusters -= 1

            data_name_snapshot = data_name.copy()
            self.iteration_data.append({
                "iteration": len(self.iteration_data) + 1,
                "distance_matrix": distances_matrix,
                "cluster": data_name_snapshot,
                "new_cluster": {
                    "distance": min_distance,
                    "index_cluster_1": index_cluster_1,
                    "index_cluster_2": index_cluster_2,
                    "total_point": total_point,
                }
            })

        self.labels = labels

    def getGraphData(self):
        return self.iteration_data[0]["distance_matrix"], self.linked_method

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
    