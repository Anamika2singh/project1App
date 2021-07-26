module.exports = {
    success: (res,msg,data) => {
      return res.status(200).json({
        statusCode: 200,
        message: msg,
        data: data,
      });
    },
    db_error: (res, e) => {
      return res.status(500).json({
        statusCode: 500,
        message: "Internal Server Error",
        error: e.message,
      });
    },

    db_errorwithoutE: (res) => {
      return res.status(500).json({
        statusCode: 500,
        message: "Internal Server Error"
      });
    },
    went_wrong: (res,e) => {
      return res.status(400).json({
        statusCode: 400,
        message: "Something Went Wrong",
        error:e.message
      });
    },
    duplicate: (res,msg) => {
      return res.status(400).json({
        statusCode: 400,
        message: msg,
      });
    },
    validation_error: (res, err) => {
      return res.status(422).json({
        statusCode: 422,
        message: err,
      });
    },
    successWithnodata: (res, msg) => {
      return res.status(200).json({
        statusCode: 200,
        message: msg
      });
    },
    login_failed: (res,msg) => {
      return res.status(400).json({
        statusCode: 400,//401
        message: msg,
      });
    },
    not_found:(res,msg) =>{
        return res.status(404).json({
            statusCode: 404,
            message: msg,
          });
    } ,
    went_wrongWithdata: (res,msg,data) => {
      return res.status(400).json({
        statusCode: 400,
        message: msg,
        data : data
      });
    },
    went_wrongwtihoutE: (res) => {
      return res.status(400).json({
        statusCode: 400,
        message: "Something Went Wrong",
      });
    }
   
  };