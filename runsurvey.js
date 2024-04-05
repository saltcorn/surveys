const {
  span,
  button,
  i,
  a,
  script,
  domReady,
  di,
  h3,
  select,
  option,
  div,
  input,
  label,
  style,
} = require("@saltcorn/markup/tags");
const View = require("@saltcorn/data/models/view");
const Workflow = require("@saltcorn/data/models/workflow");
const Table = require("@saltcorn/data/models/table");
const Form = require("@saltcorn/data/models/form");
const Field = require("@saltcorn/data/models/field");
const {
  jsexprToWhere,
  eval_expression,
  freeVariables,
} = require("@saltcorn/data/models/expression");

const db = require("@saltcorn/data/db");
const {
  stateFieldsToWhere,
  add_free_variables_to_joinfields,
  picked_fields_to_query,
} = require("@saltcorn/data/plugin-helper");
const { features } = require("@saltcorn/data/db/state");

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "Survey setting",
        form: async (context) => {
          const table = await Table.findOne({ id: context.table_id });
          const mytable = table;
          const fields = await table.getFields();
          const { child_field_list, child_relations } =
            await table.get_child_relations();
          var agg_field_opts = [];

          for (const { table, key_field } of child_relations) {
            const keyFields = table.fields.filter(
              (f) =>
                f.type === "Key" && !["_sc_files"].includes(f.reftable_name)
            );
            for (const kf of keyFields) {
              const joined_table = await Table.findOne({
                name: kf.reftable_name,
              });
              if (!joined_table) continue;
              await joined_table.getFields();
              joined_table.fields.forEach((jf) => {
                agg_field_opts.push({
                  label: `${table.name}.${key_field.name}&#8594;${kf.name}&#8594;${jf.name}`,
                  name: `${table.name}.${key_field.name}.${kf.name}.${jf.name}`,
                });
              });
            }
          }
          return new Form({
            blurb: "Survey fields and answer relation",
            fields: [
              // question title field
              // possible answers field
              // answers relation
              // answers choice field
              // answers row values
              // order questions by
              // autosave or submit button
              // destination
            ],
          });
        },
      },
    ],
  });

const get_state_fields = async (table_id, viewname, { show_view }) => {
  const table = Table.findOne(table_id);
  const table_fields = table.fields;
  return table_fields
    .filter((f) => !f.primary_key)
    .map((f) => {
      const sf = new Field(f);
      sf.required = false;
      return sf;
    });
};

const run = async (
  table_id,
  viewname,
  { relation, maxHeight, where, groupby },
  state,
  extra
) => {
  return "";
};

module.exports = {
  name: "Survey runner",
  display_state_form: false,
  get_state_fields,
  configuration_workflow,
  run,
};
