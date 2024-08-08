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

For instance, to run a single question, set the id in the view state (`?id=X` In the browser
URL; or `{id: X}` as an extra state formula). You could also base this on another variable to
show more than one question that matches some criteria. For Instance if you have a String field
on the questions table called `survey_name`, use `?survey_name=MySurvey` (URL) or
`{survey_name: "MySurvey"}` (extra state formula).

One thing you have to decide, and this module supports both modes, is whether you are going to
reuse questions across multiple users so there will be multiple answers for each question.
There is no setting for this, you simply have to set the view state to restrict which
questions are run when running the survey view.

Reusing Questions (multiple answers to each question, one for each user) is the
simplest. If you are going to instead duplicate question rows so there is one question for
each userm use an action to duplicate template question rows.

#### Setting additional fields on answers

You may want to fill in additional values on the answers table when the user answers a question. You can do this by filling in the row values formula in the survey view
configuration.

For instance, you could add a field called `filled_out_by` with type Key to user To the answers table. Then in the Row values formula, you write: `{filled_out_by: user.id}` (`user` here and in many other Saltorn formulas refer to the object representing the logged in user. If no user is logged in then it is `null` and this formula would generate an error - a safer formula would be `{filled_out_by: user?.id}`, using JavaScript's optional chaining).

You could also set a date field on the answers table using `date: new Date()`.

You can also have additional fields on the answers table which are not filled in at the time of answering the question. This can be used for instance for scoring or annotating the answer. Just make sure these fields are not required.

#### Loading answers

Sometimes you want the survey, when loaded, to be populated with previous answers in the database, for instance if the user returns to a partially completed survey. Sometimes you want those answers to be specific to e.g. the user.

Selecting the load existing answers option in the survey view configuration will look through
the answers table and load any existing Rows and populate the survey with those. With no
further configuration this will display any answer that matches the current question id.

If you would like to restrict the loaded answers further, First you should ensure that the
appropriate information is written to the answers rows that are inserted upon answering a
question. Do this by filling in the row values formula in the survey configuration; see above.

You should check that the answers are filled in with the new fields set. If this is the case
then to load these answers restricted to the Key to user field, you Enter the same formula in
the "Answers query" setting in the survey view: `{filled_out_by: user?.id}`.

In this case the row Values formula and the answer is query is the same. But this is not always
the case. You may have a date field on the answers table. This would typically not be set in
the answers query.

#### Survey sets

You can add fields to the Questions Outside the fields required for the survey view for any
purpose required, including:

- The "correct" answer, if applicable.
- A "weight" in any scoring system
- A Key to a different table representing survey sections. The survey section table can then have a Show view which embeds the Survey view based on this relation.

#### Stepper

if you want to show one question at a time, the stepper module is useful. You Should create a
Show View on the questions table, which embeds the survey view, such that running this show view will show a single question which the user will be able to answer.

Your Show view can then either embed a PreviousOrNextLink on the same table, Which will simply be a link to the next question. Alternatively, you can create a Stepper view based on the Show view to go through the questions.

#### Mobile offline sync

To collect survey data in your mobile app without an internet connection, enable the offline mode feature. Here's how:

- In the builder dialog, activate the 'Allow offline mode' option.
- Go to the 'Table Synchronization' selector and choose the relevant question/answer tables.
- If the tables do not appear in the selector, open the tables editor and ensure the 'Sync information' checkbox is checked.

This will allow your app to save survey data locally, and sync it up when an internet connection is available again.
Note: Files are not supported in offline mode.
