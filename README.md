# surveys

Surveys for Saltcorn

Surveys questions and answers are stored in tables and users can generate new surveys without
admin rights.

## Minimal setup

The minimal setup for a survey is the following

Install this module (surveys) from the module store. This will also install its dependencies json and tinymce.

You need to create two tables, one for the questions and one for the answers. You can call
these two tables whenever you like. Here we will assume they are called Survey Questions and
Survey Answers.

On the Survey Questions table create the following fields:

- A field of the type Question type (which is provided by this module)
- A String field to hold the title of the question (shown to the user)

The following fields are optional but recommended:

- A JSON Field to hold question configuration. Some question types have additional parameters,
  such as number fields that have lower and upper bounds.

- A String or JSON field to hold the possible answers for multiple choice questions. If this
  is a string you should separate the questions with a comma. A JSON field can hold an array
  of strings.

- An integer field to hold the question order. Questions displayed to the user will be ordered
  by the ascending value of this field.

On the Survey Answers table, create the following fields:

- A Key to the Survey Questions table. This will ensure you can later check which question and answer is the answer to.

- An answer field, of type JSON (recommended) or String.

Finally, create a view of pattern Survey on the Question table. You will pick out the various
fields on the question and answers tables, and select the relation between them (the Key field
on the answers table.) In the Survey view configuration, leave "Row values formula" and "Answers query" blank, Load exisiting answers unchecked for a minimal setup. Leave "Save option" to "Auto-save".

Now, if you run this view, you will see the questions appear. When you answer one of them, a value is saved to the answers table.

## Extended setup

By working with additional fields on the questions and answers tables, by running the survey
view with a specific view state, and by embedding deserve a view in other views you can achieve
extremely flexible survey workflows.

#### Edit on questions

You should create an edit view on the questions table so that you or your users can generate new questions. If you have included a question configuration field of type JSON, You should include it here with the field view question_configuration. In the settings for this field view you should set which is the field for the question type, which should also be a field in this edit view. When running this edit view, the question configuration will dynamically update according to the question type.

#### Survey view state

The survey view when run Will show any questions for which the question row matches the view
state (filter state). This means that you can use a filter on the same page, the browser
query string, or an extra state formula or relation when embedding the survey view to control
which questions are shown to the user.

One thing you have to decide, and this module supports both modes, is whether you are going to
reuse questions across multiple users so there will be multiple answers for each question.
There is no setting for this, you simply have to set the view state to restrict which
questions are run when running the survey view.

#### Loading answers

Sometimes you want the survey, when loaded, to be populated with previous answers in the database. Sometimes you want those to be A specific

#### Additional fields on questions

#### Survey sets

#### stepper
