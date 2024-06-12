const {
  select,
  option,
  text_attr,
  input,
  script,
  domReady,
  div,
} = require("@saltcorn/markup/tags");
const Table = require("@saltcorn/data/models/table");

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
          [
            "Yes/No",
            "Free text",
            "Free HTML text",
            "Multiple choice",
            "Multiple checks",
            "Integer",
            "Float",
            "File upload",
          ].map((o) => option({ selected: v === o }, o))
        );
      },
    },
  },
  read: (v, attrs) => {
    return v;
  },
};

const question_configuration = {
  type: "JSON",
  isEdit: true,
  blockDisplay: true,
  handlesTextStyle: true,
  configFields: async (field) => {
    const table = Table.findOne(field.table_id);
    const fields = table.fields;
    return [
      {
        name: "type_field",
        label: "Question type field",
        type: "String",
        required: true,
        attributes: {
          options: fields
            .filter((f) => f.type?.name === "Question type")
            .map((f) => f.name),
        },
      },
    ];
  },
  run: (nm, v, attrs, cls) => {
    const rndcls = `tmce${Math.floor(Math.random() * 16777215).toString(16)}`;
    return div(
      { id: `qconfig${rndcls}` },
      input({ type: "hidden" }),
      script(
        domReady(`
    function update_qconfig_${rndcls}() {
       const qtype=get_form_record($("#qconfig${rndcls}")).${attrs.type_field}
       console.log("qtype",qtype);
    }
    update_qconfig_${rndcls}();
    $("#qconfig${rndcls}").closest('form[data-viewname]').on('change', update_qconfig_${rndcls})    
      `)
      )
    );
  },
};

const dependencies = ["@saltcorn/tinymce", "@saltcorn/json"];

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "surveys",
  viewtemplates: [require("./runsurvey")],
  types: [questionType],
  fieldviews: { question_configuration },

  dependencies,
};
