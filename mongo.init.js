db.createUser(
        {
            user: "mongo",
            pwd: "admin",
            roles: [
                {
                    role: "readWrite",
                    db: "clustering"
                }
            ]
        }
);

db.clustering.createCollection("algorithms_results");