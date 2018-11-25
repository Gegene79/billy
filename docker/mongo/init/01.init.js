db = db.getSiblingDB('petitbilly')
db.createCollection("metrics",{})
db.createUser(
  {
    user: 'usuario',
    pwd: 'pass',
    roles: [{ role: 'readWrite', db: 'petitbilly' }]
  }
)
