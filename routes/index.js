//Here you will import route files and export the constructor method as shown in lecture code and worked in previous labs.
import routes from './auth_routes.js';

const constructorMethod = (app) => {
    app.use('/', routes);
    app.use(/(.*)/, (req, res) => {
        res.status(404).json({ error: "Not Found" });
    });
};

export default constructorMethod;