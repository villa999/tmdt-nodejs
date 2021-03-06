const { Router } = require("express")
const router = Router()
const multer = require("multer")
const path = require("path")
const checkLogin = require("../apps/middlewares/check-login")
const checkLogout = require("../apps/middlewares/check-logout")
const check_level = require("../apps/middlewares/check-level")
const upload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, path.resolve("src", "storage"))
        },
        filename: function(req, file, cb) {
            cb(null, file.fieldname + "-" + Date.now())
        }
    })
})

//const app = require("express")()
//var app = express()
const {
    AdminController,
    UserController,
    ProductController,
    CategoryController,
    LoginController,
    ClientController,
    AjaxContrller,
    CommentController
} = require("../apps/controllers")
    //const userController = require('../apps/controllers/admin/user.controller')
    //router.get("/", userController.login)
    // router.get("/form", (req,res)=>{
    //      res.render("test/form", {username:""})
    // })
    // router.post("/form", (req,res)=>{
    //      console.log("req.body",req.body);
    //      res.render("test/form",{username: req.body.username})

// })

router.route("/login").get(checkLogin, LoginController.login).post(checkLogin, LoginController.postLogin)
router.use("/admin", checkLogout)
router.get("/logout", LoginController.logout)

router.get("/admin/dashboard", AdminController.dashboard)

router.get("/admin/product", ProductController.managerproduct)
router.route("/admin/addproduct").get(ProductController.addproduct).post(upload.single("prd_image"), ProductController.store)
router.get("/admin/deleteproduct/:id", ProductController.destroy)
router.route("/admin/editproduct/:id").get(ProductController.edit).post(upload.single("prd_image"), ProductController.update)


router.get("/admin/user", UserController.manageruser)
router.route("/admin/adduser").get(UserController.adduser).post(UserController.store)
router.get("/admin/deleteuser/:id", UserController.destroy)
router.route("/admin/edituser/:id").get(UserController.edituser).post(UserController.updateuser)

router.get("/admin/category", CategoryController.managercategory)
router.get("/admin/comment", CommentController.managercomment)

router.get("/", ClientController.home)
router.get("/product-detail-:id", ClientController.productDetail)
router.get("/category-:id", ClientController.category)

router.post("/product-detail-:id/comments", ClientController.addComment)

router.post("/ajax/get-comment-product", AjaxContrller.getCommentForProduct)
router.post("/ajax/get-comment-admin", AjaxContrller.getCommentForAdmin)

module.exports = router