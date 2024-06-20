# surveys

Surveys for Saltcorn

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

Edit on questions

Loading answers

more fields on answers

surveysets

stepper.
