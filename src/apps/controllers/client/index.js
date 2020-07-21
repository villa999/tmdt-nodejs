const mongoose = require("mongoose")
const ProductModel = mongoose.model("Product")
const CategoryModel = mongoose.model("Category")
const CommentModel = mongoose.model("Comment")
const {renderHtml} = require("../../../libs/utils")
const slug = require("slug")
const Joi = require("@hapi/joi")
const transporter = require("../../../libs/transporter-mail")
module.exports.home = async function(req, res) {
    const ProductFeatured = await ProductModel.find({ prd_featured: 1 }).limit(6).sort("-_id")
    const ProductNew = await ProductModel.find({ prd_featured: 0 }).limit(6).sort("-_id")
    res.render("site/home", { ProductFeatured, ProductNew })
}

module.exports.productDetail = async function(req, res) {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Id khong dung dinh dang")
    }

    const product = await ProductModel.findById(id)

    if (!product) throw new Error("Khong tim thay san pham")


    res.render("site/detail", { product })
}
module.exports.category = async function(req, res) {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Id khong dung dinh dang")
    }

    const category = await CategoryModel.findById(id)


    const page = parseInt(req.query.page)
    const limit = 9;
    const skip = (page - 1) * limit

    const totalDocuments = await ProductModel.find({ cat_id: id }).countDocuments()
        //console.log(totalDocuments);

    const totalPages = Math.ceil(totalDocuments / limit)
    const range = []
    const rangerForDot = []
    const deltal = 2

    const left = page - deltal
    const right = page + deltal
        //console.log(right)
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= left && i <= right)) {
            range.push(i)
        }
    }
    //console.log(range)
    let temp
    range.map((i) => {
        if (temp) {
            if (i - temp === 2) {
                rangerForDot.push(i - 1)
            } else if (i - temp !== 1) {
                rangerForDot.push("...")
            }
        }
        temp = i
            //console.log("temp", temp)
        rangerForDot.push(i)

    })


    const products = await ProductModel.find({ cat_id: id }).sort("-_id").limit(limit).skip(skip)

    res.render("site/category", { products, category, total: totalDocuments, range: rangerForDot, page, totalPages })
}

module.exports.addComment = async function(req, res) {
    try {
        const bodySchema = Joi.object({
            name: Joi.string().required(),
            mail: Joi.string().email().required(),
            content: Joi.string().min(10).required()
        })

        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id)) throw Error("Id not valid")

        const value = await bodySchema.validateAsync(req.body)

        if (value instanceof Error) {
            return res.redirect(`/product-detail-${id}`)
        }

        const comment = new CommentModel({
            prd_id: id,
            content: value.content,
            info: {
                name: value.name,
                email: value.mail
            }
        })

        await comment.save()
        return res.redirect(`/product-detail-${id}`)
    } catch (error) {
        console.log(error)
    }

}


module.exports.addToCart = async function(req, res, next) {
    try {
        const bodySchema = Joi.object({
            quantity: Joi.number().required(),
            prd_id: Joi.string().required(),
            sbm: Joi.string().allow("Mua ngay", "Thêm vào giỏ hàng").required()
        })
        const value = await bodySchema.validateAsync(req.body)
        const sbm = slug(value.sbm, { lower: true })
        const product = await ProductModel.findOne({ _id: value.prd_id, prd_status: true })

        if (!product) {
            return res.redirect("/")
        }

        const oldCart = req.session.cart || []
        let isUpdate = false

        const newCart = oldCart.map((prd) => {
            if (prd.id === value.prd_id && !isUpdate) {
                prd.qty += value.quantity
                isUpdate = true
            }
            return prd
        })


        if (!isUpdate) {
            newCart.push({ id: value.prd_id, qty: value.quantity })
        }
        req.session.cart = newCart

        if (sbm === slug("mua-ngay", { lower: true })) {
            return res.redirect("/cart")
        }
        if (sbm === slug("them-vao-gio-hang", { lower: true })) {
            return res.redirect(`/product-detail-${value.prd_id}`)
        }

    } catch (error) {
        next(error)
    }
    //console.log(req.body)
}

module.exports.getCart = async function(req, res) {
    const cart = req.session.cart || []
    const ids = cart.map(prd => prd.id)
    const products = await ProductModel.find({ _id: { $in: ids } })

    res.render("site/cart", { products })
}

module.exports.order = async function(req,res, next){
    const bodySchema = Joi.object({
        name:Joi.string().required(),
        phone: Joi.number().required(),
        mail:Joi.string().email().required(),
        add: Joi.string().required()
    })
    try{
        const {name, phone, mail, add} = await bodySchema.validateAsync(req.body)
        // Dung nodemailer
        const cart = req.session.cart

        const ids = cart.map(item => item.id)

        const products = await ProductModel.find({
            _id : {$in:ids}
        })

        const html = await renderHtml(req, "email/order", {products, cart, name, phone, add})
        

        await transporter.sendMail({
            from: '"viet anh dep trai <mail@gmail.com>"',
            to: mail,
            subject: "Thông tin thanh toán mua hàng",
            html: html
        })

        res.redirect(307,"/cart/order-success")

    }catch(error){
        next(error)
    }
}

exports.orderSuccess = async function(req,res,next){
    try{
        req.session.cart = []
        res.render("site/success")
    }catch(error){
        next(error)
    }
}

exports.search = async function (req, res, next) {
    try {
      const { q = "" } = req.query;
  
      const products = await ProductModel.find({
        $text: {
          $search: q,
        },
      })
      return res.render("site/search", { q, products });
    } catch (error) {
      next(error)
    }
  }