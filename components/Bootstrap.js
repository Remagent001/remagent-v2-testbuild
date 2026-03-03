"use client";
import { useEffect } from "react";

export default function Bootstrap() {
  useEffect(() => {
    var $ = require("jquery");
    window.$ = window.jQuery = require("jquery");
    require("@/node_modules/bootstrap/dist/js/bootstrap.bundle.min");
  }, []);

  return null;
}
