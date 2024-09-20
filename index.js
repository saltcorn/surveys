const {
  select,
  option,
  text_attr,
  input,
  script,
  domReady,
  div,
  textarea,
  label,
  table,
  tr,
  tbody,
  td,
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
            onChange: (attrs.onChange || "") + "update_qconfig(this)",
            onBlur: (attrs.onChange || "") + "update_qconfig(this)",
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
            "Columns multiple choice",
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
  run: (nm, v, attrs, cls, required, field) => {
    const rndcls = `qc${Math.floor(Math.random() * 16777215).toString(16)}`;
    const configTableLine = (key, labelStr, type, qtypeClass) =>
      tr(
        {
          class: "qtype-toggle " + qtypeClass,
          style: "display: none;",
        },
        td(
          label(
            {
              for: key,
              class: "me-2",
            },
            labelStr
          )
        ),
        td(
          input({
            type,
            name: key,
            value: v?.[key],
            onChange: `change_qconfig_${rndcls}(this)`,
            ...(type === "checkbox" ? { checked: !!v?.[key] } : {}),
          })
        )
      );
    return div(
      { class: `qconfig${rndcls} qconfig-fv` },
      textarea(
        {
          class: "d-none qconfval",
          name: text_attr(nm),
          "data-fieldname": text_attr(field.name),
          id: `input${text_attr(nm)}`,
        },
        JSON.stringify(v || {})
      ),
      table(
        tbody(
          configTableLine(
            "_lower_bound",
            "Lower bound",
            "number",
            "qtype-Integer qtype-Float"
          ),
          configTableLine(
            "_upper_bound",
            "Upper bound",
            "number",
            "qtype-Integer qtype-Float"
          ),
          configTableLine(
            "_multiple",
            "Allow multiple",
            "checkbox",
            "qtype-Fileupload"
          ),
          configTableLine(
            "_columns",
            "Columns (comma separated)",
            "text",
            "qtype-Columnsmultiplechoice"
          ),
          configTableLine(
            "_multiple",
            "Allow multiple selections",
            "checkbox",
            "qtype-Columnsmultiplechoice"
          )
        )
      ),
      script(
        domReady(`
    update_qconfig();
    //$(".qconfig${rndcls}").closest('form[data-viewname]').on('change', update_qconfig)      
        `)
      ),
      script(`
         function update_qconfig(ev) {
         console.log("update qconf ev ", ev)
         const $el0 = ev ? (ev.target ? $(ev.target) : $(ev)) : $(".qconfig-fv")
         const $el = $el0.closest('.form-namespace');
         const qtype=get_form_record($el0).${attrs.type_field}
         //console.log("qrtype", qtype)
         $el.find(".qtype-toggle").hide()
         const showq= ".qtype-toggle.qtype-"+qtype.replace(/ /g, "").replace("/", "")
         $el.find(showq).show()
      }
    function change_qconfig_${rndcls}(el) {
         //console.log("change qconf", ev)
       const $el = $(el).closest(".qconfig${rndcls}")
       const qtype=get_form_record($el).${attrs.type_field}
       const o = {}
       const qs = ".qtype-"+qtype.replace(/ /g, "").replace("/", "")+" input"
       $el.find(qs).each(function() {
         const $e = $(this);
         const val = $e.attr("type") === "number"? +$e.val() :
           $e.attr("type") === "checkbox"? !!$e.prop('checked')         
           : $e.val()
         o[$e.attr("name")] = val
       })
         const $t = $el.find("textarea.qconfval")
       console.log("set val", o)
       $t.text(JSON.stringify(o))
    }
      `)
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
