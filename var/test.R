library(jug)
library(jug.parallel)

jug() %>%
  get("/", function(req, res, err){
    "Hello World!"
  }) %>%
  simple_error_handler_json() %>%
  serve_it()
  # serve_it_parallel(processes = 8, port = 8080)

