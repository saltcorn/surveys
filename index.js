const { select, option, text_attr } = require("@saltcorn/markup/tags");

const questionType = {
  name: "Question type",
  sql_name: "text",
  attributes: {},
  fieldviews: {
    show: {
      isEdit: false,
      run: (v) => v,
    },
    edit: {
      isEdit: true,
      run: (nm, v, attrs, cls, required, field) => {
        return select(
          {
            class: [
              "form-control",
              "form-select",
              cls,
              attrs.selectizable ? "selectizable" : false,
            ],
            name: text_attr(nm),
            "data-fieldname": text_attr(field.name),
            id: `input${text_attr(nm)}`,
            disabled: attrs.disabled,
            onChange: attrs.onChange,
            onBlur: attrs.onChange,
            autocomplete: "off",
            required: required,
          },
          ["Yes/No", "Free text", "Multiple choice"].map((o) =>
            option({ selected: v === o }, o)
          )
        );
      },
    },
  },
  read: (v, attrs) => {
    return v;
  },
};

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "surveys",
  viewtemplates: [require("./runsurvey")],
  types: [questionType],
};
