from scipy.cluster.hierarchy import dendrogram, linkage
import matplotlib.pyplot as plt
import boto3
from io import BytesIO

# Sample
# {
#     "message": "Success",
#     "data": {
#         "algorithm": "hierarchical",
#         "link_method": "single",
#         "iteration_data": [
#             {
#                 "iteration": 1,
#                 "distance_matrix": [
#                     {
#                         "distance": 1199,
#                         "cluster1": "D",
#                         "cluster2": "E"
#                     },
#                     {
#                         "distance": 1200.0004166665942,
#                         "cluster1": "D",
#                         "cluster2": "F"
#                     },
#                     {
#                         "distance": 1200,
#                         "cluster1": "D",
#                         "cluster2": "L"
#                     },
#                     {
#                         "distance": 1199.000417014106,
#                         "cluster1": "D",
#                         "cluster2": "H"
#                     },
#                     {
#                         "distance": 1.4142135623730951,
#                         "cluster1": "E",
#                         "cluster2": "F"
#                     },
#                     {
#                         "distance": 1,
#                         "cluster1": "E",
#                         "cluster2": "L"
#                     },
#                     {
#                         "distance": 1,
#                         "cluster1": "E",
#                         "cluster2": "H"
#                     },
#                     {
#                         "distance": 1,
#                         "cluster1": "F",
#                         "cluster2": "L"
#                     },
#                     {
#                         "distance": 1,
#                         "cluster1": "F",
#                         "cluster2": "H"
#                     },
#                     {
#                         "distance": 1.4142135623730951,
#                         "cluster1": "L",
#                         "cluster2": "H"
#                     }
#                 ],
#                 "cluster_data": [
#                     [
#                         0,
#                         1200
#                     ],
#                     [
#                         1,
#                         0
#                     ],
#                     [
#                         1,
#                         1
#                     ],
#                     [
#                         [
#                             0,
#                             1
#                         ],
#                         [
#                             0,
#                             0
#                         ]
#                     ]
#                 ],
#                 "cluster_name": [
#                     "D",
#                     "F",
#                     "H",
#                     "E-L"
#                 ]
#             },
#             {
#                 "iteration": 2,
#                 "distance_matrix": [
#                     {
#                         "distance": 1200.0004166665942,
#                         "cluster1": "D",
#                         "cluster2": "F"
#                     },
#                     {
#                         "distance": 1199.000417014106,
#                         "cluster1": "D",
#                         "cluster2": "H"
#                     },
#                     {
#                         "distance": 1199,
#                         "cluster1": "D",
#                         "cluster2": "E-L"
#                     },
#                     {
#                         "distance": 1,
#                         "cluster1": "F",
#                         "cluster2": "H"
#                     },
#                     {
#                         "distance": 1.4142135623730951,
#                         "cluster1": "F",
#                         "cluster2": "E-L"
#                     },
#                     {
#                         "distance": 1,
#                         "cluster1": "H",
#                         "cluster2": "E-L"
#                     }
#                 ],
#                 "cluster_data": [
#                     [
#                         0,
#                         1200
#                     ],
#                     [
#                         [
#                             0,
#                             1
#                         ],
#                         [
#                             0,
#                             0
#                         ]
#                     ],
#                     [
#                         [
#                             1,
#                             0
#                         ],
#                         [
#                             1,
#                             1
#                         ]
#                     ]
#                 ],
#                 "cluster_name": [
#                     "D",
#                     "E-L",
#                     "F-H"
#                 ]
#             },
#             {
#                 "iteration": 3,
#                 "distance_matrix": [
#                     {
#                         "distance": 1199,
#                         "cluster1": "D",
#                         "cluster2": "E-L"
#                     },
#                     {
#                         "distance": 1200.0004166665942,
#                         "cluster1": "D",
#                         "cluster2": "F-H"
#                     },
#                     {
#                         "distance": 1.4142135623730951,
#                         "cluster1": "E-L",
#                         "cluster2": "F-H"
#                     }
#                 ],
#                 "cluster_data": [
#                     [
#                         0,
#                         1200
#                     ],
#                     [
#                         [
#                             0,
#                             1
#                         ],
#                         [
#                             0,
#                             0
#                         ],
#                         [
#                             1,
#                             0
#                         ],
#                         [
#                             1,
#                             1
#                         ]
#                     ]
#                 ],
#                 "cluster_name": [
#                     "D",
#                     "E-L-F-H"
#                 ]
#             },
#             {
#                 "iteration": 4,
#                 "distance_matrix": [
#                     {
#                         "distance": 1199,
#                         "cluster1": "D",
#                         "cluster2": "E-L-F-H"
#                     }
#                 ],
#                 "cluster_data": [
#                     [
#                         [
#                             0,
#                             1200
#                         ],
#                         [
#                             0,
#                             1
#                         ],
#                         [
#                             0,
#                             0
#                         ],
#                         [
#                             1,
#                             0
#                         ],
#                         [
#                             1,
#                             1
#                         ]
#                     ]
#                 ],
#                 "cluster_name": [
#                     "D-E-L-F-H"
#                 ]
#             }
#         ],
#         "header": [
#             "Name",
#             "Weight",
#             "Height"
#         ],
#         "data_name": [
#             "D",
#             "E",
#             "F",
#             "L",
#             "H"
#         ]
#     }
# }

# ([{'distance': 1199.0, 'cluster1': 'D', 'cluster2': 'E'}, {'distance': 1200.0004166665942, 'cluster1': 'D', 'cluster2': 'F'}, {'distance': 1200.0, 'cluster1': 'D', 'cluster2': 'L'}, {'distance': 1199.000417014106, 'cluster1': 'D', 'cluster2': 'H'}, {'distance': 1.4142135623730951, 'cluster1': 'E', 'cluster2': 'F'}, {'distance': 1.0, 'cluster1': 'E', 'cluster2': 'L'}, {'distance': 1.0, 'cluster1': 'E', 'cluster2': 'H'}, {'distance': 1.0, 'cluster1': 'F', 'cluster2': 'L'}, {'distance': 1.0, 'cluster1': 'F', 'cluster2': 'H'}, {'distance': 1.4142135623730951, 'cluster1': 'L', 'cluster2': 'H'}], 'single', ['D', 'E', 'F', 'L', 'H'])

LABELS = ('D', 'E', 'F', 'L', 'H')
MATRIX = [{'distance': 1199.0, 'cluster1': 'D', 'cluster2': 'E'}, {'distance': 1200.0004166665942, 'cluster1': 'D', 'cluster2': 'F'}, {'distance': 1200.0, 'cluster1': 'D', 'cluster2': 'L'}, {'distance': 1199.000417014106, 'cluster1': 'D', 'cluster2': 'H'}, {'distance': 1.4142135623730951, 'cluster1': 'E', 'cluster2': 'F'}, {'distance': 1.0, 'cluster1': 'E', 'cluster2': 'L'}, {'distance': 1.0, 'cluster1': 'E', 'cluster2': 'H'}, {'distance': 1.0, 'cluster1': 'F', 'cluster2': 'L'}, {'distance': 1.0, 'cluster1': 'F', 'cluster2': 'H'}, {'distance': 1.4142135623730951, 'cluster1': 'L', 'cluster2': 'H'}]
linkedMethod = 'single' 

# distance_matrix, linkedMethod, labels
def draw_hierarchical():
    linkage_matrix = []
    for i, distance_data in enumerate(MATRIX):
        linkage_matrix.append([i, i + 1, distance_data["distance"], 2])

    # Generate the linkage matrix
    Z = linkage(linkage_matrix, method=linkedMethod)


    print(linkage_matrix)

    print(Z)

    # Plot the dendrogram
    plt.figure(figsize=(10, 7))
    dendrogram(Z, labels=LABELS)
    plt.title('Hierarchical Clustering Dendrogram')
    plt.xlabel('Cluster')
    plt.ylabel('Distance')

    plt.draw()

    plt.savefig('./hierarchical.png')
    print("success")

    # s3 = boto3.resource('s3')
    
    # buffer = BytesIO()
    # plt.savefig(buffer, format='png')
    # buffer.seek(0)

    # print(buffer.getbuffer())

    # s3.Bucket('clustering-graph').put_object(Key='hierarchical.png', Body=buffer.getbuffer(), ContentType='image/png')

draw_hierarchical()