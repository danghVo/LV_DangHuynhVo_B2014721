import math

class Distance:
    def __init__(self, distance_type):
        self.distance_type = distance_type
    
    def euclidean(self, a, b):
        return math.sqrt(sum((pow(x - y, 2) for x, y in zip(a, b))))
        
    def manhattan(self, a, b):
        return sum((abs(x - y) for x, y in zip(a, b)))

    def calculate(self, a, b):
        if self.distance_type == 'euclidean':
            return self.euclidean(a, b)
        elif self.distance_type == 'manhattan':
            return self.manhattan(a, b)
   