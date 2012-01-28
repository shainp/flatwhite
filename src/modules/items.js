var utils = require("../utils");
var data = require("./data");
var itemTags = require("./items/itemTags");
var itemImages = require("./items/itemImages");

/*
Content items manager
*/
var items = (function () {
    
    var module = {};
    
    module.version = 1;
    
    module.execute = function (method, req, res, next) {
        try {
            switch(method) {
                case "post":
                    //new item
                    executePost(req, res);
                    break;
                case "get":
                    //get item
                    executeGet(req, res);
                    break;
                case "delete":
                    //delete item
                    executeDelete(req, res);
                    break;
                case "put":
                    //update
                    executePut(req, res);
                    break;
            }
        } catch(err) {
            utils.log(err, true);
            utils.responseError(res, err);
        }
    };
    
    var executePost = function(req, res) {
        //check if the action is related to a child item
        if(req.params.child) {
            //execute child module
            switch(req.params.child) {
                case "tags":
                    //add tag
                    itemTags.addTag(req.params.item, req.body.tag.split(","), function(err, obj) {
                        if(err) {
                            utils.log("error adding tag", true);
                            utils.responseError(res, err);
                        } else {
                            utils.log("tag added successfully");
                            utils.responseObject(res, obj);
                        }
                    });
                    break;
                case "images":
                    //images.addImage(req.params.item, req, res);
                    break;
            }
        } else {
            utils.log("new content item");
            
            title = req.body.title != null ? req.body.title : "";
            summary = req.body.summary != null ? req.body.summary : "";
            text = req.body.text != null ? req.body.text : "";
            code = req.body.code != null ? req.body.code : "";
            active = req.body.active != null ? req.body.active : "false";
            
            utils.log("adding item: " + code);
            
            module.addItem({
                title: title, 
                summary: summary, 
                text: text, 
                code: code,
                active: active,
                tags: [],
                images: []
            }, function(err, obj) {
                if(err) {
                    utils.log("error adding content item", true);
                    utils.responseError(res, err);
                } else {
                    utils.log("content item added successfully");
                    utils.responseObject(res, obj);
                }
            });
        }
    };
    
    var executeDelete = function(req, res) {
        utils.log("contentitem delete");
        itemId = req.params.item != null ? req.params.item : "";
        if(itemId != "") {
            module.deleteItem(itemId, function(err, obj) {
                if(err) {
                    utils.log("error in delete item", true);
                    utils.responseError(res, err);
                } else {
                    utils.log("content item deleted successfully");
                    utils.response(res, "deleted content item " + itemId);
                }
            });
        } else {
            utils.log("invalid content item id", true);
            utils.responseError(res, "invalid content item id");
        }
    };
    
    //gets the whole object
    var executeGet = function(req, res) {
        //first search by id, otherwise by code
        itemId = req.params.item != null ? req.params.item : "";
        utils.log("item get");
        module.getItem(itemId, function(err, obj) {
            if(err) {
                utils.log("error searching content item, search by code", true);
                
                module.getItemByCode(itemId, function(err, obj) {
                    if(err) {
                        utils.log("error in retrieve item", true);
                        utils.responseError(res, err);
                    } else {
                        utils.log(obj == null ? "item null" : "item returned successfully");
                        utils.responseObject(res, obj);
                    }
                });
                
            } else {
                utils.log(obj == null ? "item not found" : "item returned successfully");
                if(obj == null) {
                    utils.notFound(res, obj);
                } else {
                    utils.responseObject(res, obj);
                }
            }
        });
    };
    
    module.addItem = function(item, callback) {
        //if code is not empty check if another one exists
        if(item.code) {
            module.getItemByCode(item.code, function(err, obj) {
                if(obj.length > 0) {
                    callback("error updating item, code already exists. choose a different code or live it empty", null);
                } else {
                    data.instance().collection("items").add({ 
                            title: item.title,
                            summary: item.summary,
                            text: item.text,
                            code: item.code,
                            active: Boolean(item.active),
                            tags: item.tags,
                            images: item.images
                        }, callback);
                }
            });
        } else {
            data.instance().collection("items").add({ 
                    title: item.title,
                    summary: item.summary,
                    text: item.text,
                    code: item.code,
                    active: Boolean(item.active),
                    tags: item.tags,
                    images: item.images
                }, callback);
        }
    };
    
    module.getItemByCode = function(code, callback) {
        data.instance().collection("items").list({code: code}, [], callback);
    };
    
    module.getItem = function(id, callback) {
        data.instance().collection("items").get(id, callback);
    };
    
    module.deleteItem = function(id, callback) {
        data.instance().collection("items").remove(id, callback);
    };
    
    module.updateItem = function(id, item, callback) {
        //if code is not empty check if another one exists
        if(item.code) {
            module.getItemByCode(item.code, function(err, obj) {
                if(obj.length > 0) {
                    callback("error updating item, code already exists. choose a different code or live it empty", null);
                } else {
                    data.instance().collection("items").update(id, { 
                        title: item.title,
                        summary: item.summary,
                        text: item.text,
                        code: item.code,
                        active: Boolean(item.active)
                    }, callback);
                }
            });
        } else {
            data.instance().collection("items").update(id, { 
                title: item.title,
                summary: item.summary,
                text: item.text,
                code: item.code,
                active: Boolean(item.active)
            }, callback);
        }
    };
    
    return module;
    
}());

module.exports = items;