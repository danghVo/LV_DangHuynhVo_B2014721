import matplotlib.pyplot as plt
import boto3
from io import BytesIO

def draw_kmeans_graph(init_centroid, centroids, labels, labels_in_name):

    try:
        # Plotting the initial centroids
        plt.scatter(*zip(*init_centroid), c='red', marker='x', label='Initial Centroids')

        # Plotting the data points and their assigned centroids
        colors = ['blue', 'green', 'black', 'purple', 'orange', 'brown', 'pink', 'gray', 'olive', 'cyan']
        for i, cluster in enumerate(labels):
            points = cluster
            plt.scatter(*zip(*points), c=colors[i], label=f'Cluster {i+1}')
            plt.scatter(*centroids[i], c=colors[i], marker='o', edgecolor='black')

        # Adding labels to the points
        for i, cluster in enumerate(labels):
            for j, point in enumerate(cluster):
                plt.text(point[0], point[1], labels_in_name[i][j], fontsize=12, ha='right')

        plt.xlabel('X-axis')
        plt.ylabel('Y-axis')
        plt.title('K-means Clustering')
        plt.legend()
        plt.grid(True)

        buffer = BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)

        s3 = boto3.resource('s3')
        s3.Bucket('clustering-graph').put_object(Key='kmeans.png', Body=buffer.getvalue(), ContentType='image/png')
    except Exception as e:
        print("Draw kmeans graph error: " + e)
        return "Internal server error"
