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
  textarea,
  style,
  form,
  p,
  text_attr,
} = require("@saltcorn/markup/tags");

const View = require("@saltcorn/data/models/view");
const Workflow = require("@saltcorn/data/models/workflow");
const Table = require("@saltcorn/data/models/table");
const Form = require("@saltcorn/data/models/form");
const Trigger = require("@saltcorn/data/models/trigger");
const Field = require("@saltcorn/data/models/field");
const File = require("@saltcorn/data/models/file");
const {
  jsexprToWhere,
  eval_expression,
  freeVariables,
} = require("@saltcorn/data/models/expression");

const db = require("@saltcorn/data/db");
const { getState } = require("@saltcorn/data/db/state");
const {
  stateFieldsToWhere,
  add_free_variables_to_joinfields,
  picked_fields_to_query,
  readState,
} = require("@saltcorn/data/plugin-helper");
const { features } = require("@saltcorn/data/db/state");

const checkbox_group = ({
  name,
  options,
  value,
  inline,
  form_name,
  onChange,
  ...rest
}) =>
  div(
    (options || [])
      .filter((o) => (typeof o === "string" ? o : o.value))
      .map((o, ix) => {
        const myvalue = typeof o === "string" ? o : o.value;
        const id = `input${text_attr(name)}${ix}`;
        return div(
          { class: ["form-check", inline && "form-check-inline"] },
          input({
            class: ["form-check-input", rest.class],
            type: "checkbox",
            name,
            onChange,
            "data-fieldname": form_name,
            id,
            value: text_attr(myvalue),
            checked: Array.isArray(value)
              ? value.includes(myvalue)
              : myvalue === value,
          }),
          label(
            { class: "form-check-label", for: id },
            typeof o === "string" ? o : o.label
          )
        );
      })
      .join("")
  );

//copied from saltconr markup to avoid filter in options
const radio_group = ({
  name,
  options,
  value,
  inline,
  form_name,
  onChange,
  required,
  ...rest
}) =>
  div(
    (options || []).map((o, ix) => {
      const myvalue = typeof o === "string" ? o : o.value;
      const id = `input${text_attr(name)}${ix}`;
      return div(
        { class: ["form-check", inline && "form-check-inline"] },
        input({
          class: ["form-check-input", rest.class],
          type: "radio",
          name,
          onChange,
          required: !!required,
          "data-fieldname": form_name,
          id,
          value: text_attr(myvalue),
          checked: myvalue === value,
        }),
        label(
          { class: "form-check-label", for: id },
          typeof o === "string" ? o : o.label
        )
      );
    })
  );

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "Survey setting",
        form: async (context) => {
          const table = Table.findOne({ id: context.table_id });
          const mytable = table;
          const fields = table.getFields();
          const { child_field_list, child_relations } =
            await table.get_child_relations();
          const answer_field_opts = {};
          //console.log(child_relations);
          for (const { table, key_field } of child_relations) {
            const rel = `${table.name}.${key_field.name}`;
            answer_field_opts[rel] = [];
            table.fields
              .filter(
                (f) => f.type?.name === "String" || f.type?.name === "JSON"
              )
              .forEach((f) => {
                answer_field_opts[rel].push(f.name);
              });
          }
          const numFields = fields
            .filter(
              (f) => f.type?.name === "Integer" || f.type?.name === "Float"
            )
            .map((f) => f.name);

          const triggers = await Trigger.find({});
          return new Form({
            blurb: "Survey fields and answer relation",
            fields: [
              {
                name: "title_field",
                label: "Title field",
                type: "String",
                required: true,
                attributes: {
                  options: fields
                    .filter((f) => f.type?.name === "String")
                    .map((f) => f.name),
                },
              },
              {
                name: "type_field",
                label: "Question type field",
                type: "String",
                required: true,
                attributes: {
                  options: [
                    ...fields
                      .filter((f) => f.type?.name === "Question type")
                      .map((f) => f.name),
                    "Fixed",
                  ],
                },
              },
              {
                name: "fixed_type",
                label: "Fixed question type",
                type: "Question type",
                required: true,
                fieldview: "edit",
                showIf: { type_field: "Fixed" },
              },
              {
                name: "options_field",
                label: "Options field",
                sublabel: "Field holding the possible answers to the question",
                type: "String",
                attributes: {
                  options: fields
                    .filter(
                      (f) =>
                        f.type?.name === "String" || f.type?.name === "JSON"
                    )
                    .map((f) => f.name),
                },
              },
              {
                name: "config_field",
                label: "Question configuration field",
                type: "String",
                attributes: {
                  options: fields
                    .filter((f) => f.type?.name === "JSON")
                    .map((f) => f.name),
                },
              },
              {
                name: "answer_relation",
                label: "Answer relation",
                sublabel: "Answer rows will be generated by this relation", // todo more detailed explanation
                input_type: "select",
                options: child_field_list,
              },
              {
                name: "answer_field",
                label: "Answer field",
                sublabel: "This field will be filled with the answer", // todo more detailed explanation
                type: "String",
                attributes: {
                  calcOptions: ["answer_relation", answer_field_opts],
                },
              },

              // answer row values
              // order questions by
              {
                name: "order_field",
                label: "Order by field",
                sublabel:
                  "Order questions by this field if there are multiple questions in one survey",
                type: "String",
                attributes: {
                  options: fields.map((f) => f.name),
                },
              },
              {
                name: "field_values_formula",
                label: "Row values formula",
                class: "validate-expression",
                sublabel:
                  "Additional field values set on the answer table. <code>row</code> referes to the view state. For example <code>{project: row.project, user: user.id, filled: new Date()}</code>",
                type: "String",
                fieldview: "textarea",
              },
              {
                name: "how_save",
                label: "Save option",
                type: "String",
                required: true,
                attributes: {
                  options: ["Auto-save" /*, "Save button with destination"*/],
                },
              },
              // autosave or submit button
              // destination
              {
                name: "destination_url",
                label: "Destination URL",
                type: "String",
                showIf: { how_save: "Save button with destination" },
              },
              {
                name: "load_existing_answers",
                label: "Load existing answers",
                type: "Bool",
              },
              {
                name: "existing_answer_query",
                label: "Answers query",
                class: "validate-expression",
                sublabel:
                  "Additional query when loading exisitng answers. For example <code>{user: user.id}</code>",
                type: "String",
                fieldview: "textarea",
                showIf: { load_existing_answers: true },
              },
              {
                name: "yes_label",
                label: "Yes label",
                type: "String",
                default: "Yes",
              },
              {
                name: "no_label",
                label: "No label",
                type: "String",
                default: "No",
              },
              {
                name: "complete_action",
                label: "Complete action",
                sublabel:
                  "Run this action when all questions have been answered",
                type: "String",
                attributes: {
                  options: triggers.map((tr) => tr.name),
                },
              },
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
  {
    title_field,
    options_field,
    order_field,
    answer_relation,
    answer_field,
    type_field,
    fixed_type,
    how_save,
    load_existing_answers,
    existing_answer_query,
    lower_field,
    upper_field,
    complete_action,
    yes_label,
    no_label,
    config_field,
  },
  state,
  extra,
  queriesObj
) => {
  // what questions are in state?
  const { qs, existing_values, existing_answer_ids } =
    queriesObj?.question_answers_query
      ? await queriesObj.question_answers_query(state)
      : await getQuestionAnswersImpl(
          table_id,
          {
            order_field,
            answer_relation,
            existing_answer_query,
            load_existing_answers,
            answer_field,
          },
          state,
          extra.req
        );
  const table = await Table.findOne({ id: table_id });
  const rndid = Math.round(Math.random() * 100000);
  const yesnoqs = [];
  const getOptions = (q) => {
    const optVal = q[options_field];
    const options = Array.isArray(optVal)
      ? optVal
      : optVal.split(",").map((s) => s.trim());
    return options;
  };
  return form(
    {
      method: "POST",
      action: `/view/${viewname}`,
      class: `survey survey-${viewname.replaceAll(" ", "")}`,
      onChange:
        how_save === "Auto-save"
          ? `change_survey_${db.sqlsanitize(viewname)}_${rndid}(event)`
          : undefined,
    },
    input({ type: "hidden", name: "_csrf", value: extra.req.csrfToken() }),
    input({
      type: "hidden",
      name: "_state",
      value: text_attr(JSON.stringify(state)),
    }),
    qs.map((q, qix) => {
      const qtype = type_field === "Fixed" ? fixed_type : q[type_field];
      if (qtype === "Multiple choice") {
        const options = getOptions(q);
        return div(
          { class: "mb-3 survey-question survey-question-mcq" },
          p({ class: "survey-question-text" }, q[title_field]),
          div(
            { class: "survey-question-body" },
            options.length > 5
              ? select(
                  { name: `q${q[table.pk_name]}`, class: "form-select" },
                  options.map((o) =>
                    option(
                      { selected: o == existing_values[q[table.pk_name]] },
                      o
                    )
                  )
                )
              : radio_group({
                  name: `q${q[table.pk_name]}`,
                  value: existing_values[q[table.pk_name]],
                  options,
                })
          )
        );
      }
      if (qtype === "Multiple checks")
        return div(
          { class: "mb-3 survey-question survey-question-mcc" },
          p({ class: "survey-question-text" }, q[title_field]),
          div(
            { class: "survey-question-body" },
            checkbox_group({
              name: `q${q[table.pk_name]}`,
              value: existing_values[q[table.pk_name]],
              options: getOptions(q),
              class: "multicheck",
            })
          )
        );
      if (qtype === "Free text")
        return div(
          { class: "mb-3 survey-question survey-question-free-text" },
          p({ class: "survey-question-text" }, q[title_field]),
          div(
            { class: "survey-question-body" },
            textarea(
              {
                class: "form-control",
                name: `q${q[table.pk_name]}`,
              },
              existing_values[q[table.pk_name]] || ""
            )
          )
        );
      if (qtype === "Free HTML text") {
        const fv = getState().types["HTML"].fieldviews.TinyMCE;
        return div(
          { class: "mb-3 survey-question survey-question-html-text" },
          p({ class: "survey-question-text" }, q[title_field]),
          div(
            { class: "survey-question-body" },
            fv.run(
              `q${q[table.pk_name]}`,
              existing_values[q[table.pk_name]] || "",
              { toolbar: "Standard", quickbar: true, autogrow: true }
            )
          )
        );
      }
      if (qtype === "Integer")
        return div(
          { class: "mb-3 survey-question survey-question-int" },
          p({ class: "survey-question-text" }, q[title_field]),
          div(
            { class: "survey-question-body" },
            input({
              class: "form-control",
              name: `q${q[table.pk_name]}`,
              type: "number",
              max: config_field
                ? q[config_field]?._upper_bound
                : q[upper_field],
              min: config_field
                ? q[config_field]?._lower_bound
                : q[lower_field],
              step: 1,
              value: existing_values[q[table.pk_name]],
            })
          )
        );
      if (qtype === "File upload") {
        const existing = existing_values[q[table.pk_name]];
        return div(
          { class: "mb-3 survey-question survey-question-files" },
          p({ class: "survey-question-text" }, q[title_field]),
          div(
            { class: "survey-question-body" },
            Array.isArray(existing) &&
              existing.map((f) => a({ href: `/files/serve/${f}` }, f)),
            input({
              class: "form-control",
              name: `q${q[table.pk_name]}`,
              type: "file",
              multiple: config_field ? q[config_field]?._multiple : true,
            })
          )
        );
      }
      if (qtype === "Float")
        return div(
          { class: "mb-3 survey-question survey-question-int" },
          p({ class: "survey-question-text" }, q[title_field]),
          div(
            { class: "survey-question-body" },
            input({
              class: "form-control",
              name: `q${q[table.pk_name]}`,
              type: "number",
              max: q[upper_field],
              min: q[lower_field],
              value: existing_values[q[table.pk_name]],
            })
          )
        );
      if (qtype === "Yes/No") {
        yesnoqs.push(`q${q[table.pk_name]}`);
        return div(
          { class: "mb-3 survey-question survey-question-yesno" },
          p({ class: "survey-question-text" }, q[title_field]),
          div(
            { class: "survey-question-body" },
            radio_group({
              name: `q${q[table.pk_name]}`,
              value: existing_values[q[table.pk_name]],
              options: [
                { label: yes_label || "Yes", value: true },
                { label: no_label || "No", value: false },
              ],
            })
          )
        );
      }
    }),
    how_save === "Save button with destination"
      ? button({ type: "submit", class: "btn btn-primary" }, "Save")
      : script(
          domReady(`
      let ansIds = ${JSON.stringify(existing_answer_ids)}
      const qnames= ${JSON.stringify(qs.map((q) => `q${q.id}`))}
      const yesnoqs = ${JSON.stringify(yesnoqs)};
      let completed = false
      //https://stackoverflow.com/a/52311051/19839414
      function getBase64(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
            if ((encoded.length % 4) > 0) {
              encoded += '='.repeat(4 - (encoded.length % 4));
            }
            resolve(encoded);
          };
          reader.onerror = error => reject(error);
        });
      }

      window.change_survey_${db.sqlsanitize(
        viewname
      )}_${rndid} = async (event)=>{
        const $input = $(event.target)        
        const name = $input.attr('name')
        if(!name) return
        let value;
        if($input.hasClass("multicheck")) {
          value = []
          $('input[name="' + name + '"]:checked').each(function() {
            value.push($(this).val());
          })
        } else if($input.attr("type")==="file") {
          value = [];
          for(const file of $input.prop('files')) {
            value.push({ base64: await getBase64(file), name: file.name, type: file.type })
          }
        } else {
          value = $input.attr("type") ==="checkbox" ? $input.is(":checked"): $input.val()
        }
        if(yesnoqs.includes(name)) value= value==="true";
        const dataObj = {name, value, state: ${JSON.stringify(state)}}
        if(ansIds[name]) 
          dataObj.answer_id = ansIds[name];
        view_post('${viewname}', 'autosave_answer', dataObj,(res)=>{
          if(res.answer_id) ansIds[name] = res.answer_id;

          ${
            complete_action
              ? `
          const complete = qnames.every(qn=>!!ansIds[qn]);
          if(complete && !completed) {
            completed = true; 
            view_post('${viewname}', 'completed', {
                state: ${JSON.stringify(state)},
                answer_ids: Object.values(ansIds),
                question_ids: ${JSON.stringify(qs.map((q) => q.id))}
              })
            }`
              : ""
          }
        });


      }`)
        )
  );
};

const runPost = async (
  table_id,
  viewname,
  {
    answer_relation,
    answer_field,
    type_field,
    fixed_type,
    field_values_formula,
    destination_url,
  },
  _state,
  body,
  { res },
  queriesObj
) => {
  if (queriesObj?.run_post_query) await queriesObj.run_post_query(_state, body);
  else
    await runPostImpl(
      table_id,
      {
        answer_relation,
        answer_field,
        type_field,
        fixed_type,
        field_values_formula,
      },
      _state,
      body,
      req
    );
  res.redirect(destination_url);
};

//whole column has been moved
const autosave_answer = async (
  table_id,
  viewname,
  {
    answer_relation,
    answer_field,
    type_field,
    fixed_type,
    field_values_formula,
  },
  body,
  { req },
  queriesObj
) => {
  return queriesObj?.autosave_answer_query
    ? await queriesObj.autosave_answer_query(body)
    : await autoSaveAnswerImpl(
        table_id,
        {
          answer_relation,
          answer_field,
          type_field,
          fixed_type,
          field_values_formula,
        },
        body,
        req
      );
};
const completed = async (
  table_id,
  viewname,
  { answer_relation, complete_action },
  body,
  { req },
  queriesObj
) => {
  if (queriesObj?.completed_query)
    return await queriesObj.completed_query(body);
  else
    return await completedImpl(
      table_id,
      { answer_relation, complete_action },
      body,
      req
    );
};

const getQuestionAnswersImpl = async (
  table_id,
  {
    order_field,
    answer_relation,
    existing_answer_query,
    load_existing_answers,
    answer_field,
  },
  state,
  req
) => {
  const table = await Table.findOne({ id: table_id });
  const fields = table.fields;
  readState(state, fields);
  const where = await stateFieldsToWhere({ fields, state, table });
  const qs = await table.getRows(
    where,
    order_field ? { orderBy: order_field } : {}
  );
  const existing_values = {};
  const existing_answer_ids = {};
  if (load_existing_answers) {
    const [ansTableName, ansTableKey] = answer_relation.split(".");
    const ansTable = Table.findOne({ name: ansTableName });
    const ansField = ansTable.getField(answer_field);

    const qextra = existing_answer_query
      ? eval_expression(existing_answer_query, state, req.user)
      : {};
    const ans_rows = await ansTable.getRows({
      ...qextra,
      [ansTableKey]: { in: qs.map((qrow) => qrow[table.pk_name]) }, // sqlite
    });
    ans_rows.forEach((arow) => {
      existing_values[arow[ansTableKey]] = arow[answer_field];
      existing_answer_ids[`q${arow[ansTableKey]}`] = arow[ansTable.pk_name];
    });
  }
  return { qs, existing_values, existing_answer_ids };
};

const runPostImpl = async (
  table_id,
  {
    answer_relation,
    answer_field,
    type_field,
    fixed_type,
    field_values_formula,
  },
  _state,
  body,
  req
) => {
  const table = Table.findOne({ id: table_id });
  const fields = table.getFields();
  const state = JSON.parse(body._state);
  readState(state, fields); // there is no state here
  const where = await stateFieldsToWhere({ fields, state, table });
  const qs = await table.getRows(where);

  const [ansTableName, ansTableKey] = answer_relation.split(".");
  const ansTable = Table.findOne({ name: ansTableName });
  const ansField = ansTable.getField(answer_field);
  let wrap =
    ansField.type.name === "JSON" && !features?.stringify_json_fields
      ? (s) => JSON.stringify(s)
      : (s) => s;
  let extraVals = {};
  if (field_values_formula) {
    extraVals = eval_expression(field_values_formula, state, req.user);
  }
  for (const qrow of qs) {
    const qtype = type_field === "Fixed" ? fixed_type : qrow[type_field];
    await ansTable.insertRow(
      {
        ...extraVals,
        [ansTableKey]: qrow[table.pk_name],
        [answer_field]: wrap(
          qtype === "Yes/No"
            ? body[`q${qrow[table.pk_name]}`] === "on"
            : body[`q${qrow[table.pk_name]}`]
        ),
      },
      req.user
    );
  }
};

const completedImpl = async (
  table_id,
  { answer_relation, complete_action },
  body,
  req
) => {
  const table = await Table.findOne({ id: table_id });
  const questions = await table.getRows({
    [table.pk_name]: { in: body.question_ids }, // sqlite
  });
  const [ansTableName, ansTableKey] = answer_relation.split(".");
  const ansTable = Table.findOne({ name: ansTableName });
  const answers = await ansTable.getRows({
    [ansTable.pk_name]: { in: body.answer_ids },
  });
  const state = body.state;
  const trigger = await Trigger.findOne({ name: complete_action });
  const action_result = await trigger.runWithoutRow({
    req,
    user: req.user,
    questions,
    answers,
    state,
  });
  return { json: { success: "ok", ...action_result } };
};

const autoSaveAnswerImpl = async (
  table_id,
  {
    answer_relation,
    answer_field,
    type_field,
    fixed_type,
    field_values_formula,
  },
  body,
  req
) => {
  const table = await Table.findOne({ id: table_id });
  const qid = +body.name.substring(1);
  const qrow = await table.getRow({ [table.pk_name]: qid });
  const [ansTableName, ansTableKey] = answer_relation.split(".");
  const state = body.state;

  const ansTable = Table.findOne({ name: ansTableName });
  const ansField = ansTable.getField(answer_field);
  let wrap =
    ansField.type.name === "JSON" && !features?.stringify_json_fields
      ? (s) => JSON.stringify(s)
      : (s) => s;
  let extraVals = {};
  if (field_values_formula) {
    extraVals = eval_expression(field_values_formula, state, req.user);
  }
  const qtype = type_field === "Fixed" ? fixed_type : qrow[type_field];
  let answer_value;
  if (qtype === "File upload") {
    answer_value = [];
    // save file
    for (const { base64, name, type } of body.value) {
      const file = await File.from_contents(
        name,
        type,
        Buffer.from(base64, "base64"),
        req.user?.id,
        req.user?.role_id || 1
      );
      answer_value.push(file.path_to_serve);
    }
    answer_value = wrap(answer_value);
    // set val to filename
  } else answer_value = wrap(body.value);
  const new_row = {
    ...extraVals,
    [ansTableKey]: qrow[table.pk_name],
    [answer_field]: answer_value,
  };

  if (body.answer_id) {
    await ansTable.updateRow(new_row, body.answer_id, req.user);
    return { json: { success: "ok" } };
  } else {
    const insres = await ansTable.insertRow(new_row, req.user);
    return { json: { success: "ok", answer_id: insres } };
  }
};

module.exports = {
  name: "Survey",
  display_state_form: false,
  get_state_fields,
  configuration_workflow,
  run,
  runPost,
  routes: { autosave_answer, completed },
  queries: ({
    table_id,
    configuration: {
      order_field,
      answer_relation,
      existing_answer_query,
      load_existing_answers,
      answer_field,
      type_field,
      fixed_type,
      field_values_formula,
      complete_action,
    },
    req,
  }) => ({
    question_answers_query: async (state) => {
      return await getQuestionAnswersImpl(
        table_id,
        {
          order_field,
          answer_relation,
          existing_answer_query,
          load_existing_answers,
          answer_field,
        },
        state,
        req
      );
    },
    run_post_query: async (state, body) => {
      return await runPostImpl(
        table_id,
        {
          answer_relation,
          answer_field,
          type_field,
          fixed_type,
          field_values_formula,
        },
        state,
        body,
        req
      );
    },
    completed_query: async (body) => {
      return await completedImpl(
        table_id,
        { answer_relation, complete_action },
        body,
        req
      );
    },
    autosave_answer_query: async (body) => {
      return await autoSaveAnswerImpl(
        table_id,
        {
          answer_relation,
          answer_field,
          type_field,
          fixed_type,
          field_values_formula,
        },
        body,
        req
      );
    },
  }),
};

/* TO DO

*/
