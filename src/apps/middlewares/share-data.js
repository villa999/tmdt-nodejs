const mongoose = require("mongoose")
const CategoryModel = mongoose.model("Category")
module.exports = async function(req, res, next) {
    //Su dung res locals
    res.locals.menus = await CategoryModel.find()
    next()
}