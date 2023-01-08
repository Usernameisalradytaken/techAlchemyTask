# Tech Alchmey Task

Backend application that fetches data from various sources and parse the data according to the needs. Also had to implement /signup, /login , logout functionality and manage user sessions.

## How to run the application

1. git clone the repo
2. npm install
3. Change the api keys and the database url and jwt_secret as well as session_secret in .env.testing file
4. Change the name of .env.testing file to .env
5. Run command npm run start
## API documentation in POSTMAN :-

https://documenter.getpostman.com/view/23688165/2s8Z75SVbn

## Whats in the project/ What i did

5 routes where created according to the requried 

- `/api/weather` - Had to implement the weather api, any user can access this api http://api.openweathermap.org/data/2.5/forecast/daily?q=London&cnt=3&appid={API key} and i had to parse the data according to the requirement

- `/api/signup` - requires name, password, email to register a new user and encrypted password was stored in DB
- `/api/login` - after successful login, session is create for login user
- `/api/logout` - user can logout
- `/api/news/?search=bitcoin` - this is protected routes only login user can access it.
