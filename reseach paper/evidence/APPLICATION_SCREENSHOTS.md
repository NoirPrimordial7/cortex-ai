# Application screenshot evidence

Seven user-supplied originals are preserved byte for byte under `inputs/application-screenshots/`. The local directory is ignored by Git because the full sign-in, dashboard and account views show demo identities or account fields. The [manifest](application-screenshot-manifest.json) records filenames, dimensions, hashes and panel selection.

- **Panel (a)** uses the supported leave-answer capture and its open source pane. The excerpts preserve the answer value, exact cited passage, source locator, applicability date, scope and effective interval.
- **Panel (b)** uses the conflict capture. One excerpt shows the abstention rule and the other shows both policy names, the scope and the date. The screenshot does not show the expanded claim values.
- **The five other views** remain local supplementary evidence. The permissions image shows workspace action roles with demo names and account identifiers, so it would not establish a document-level grant. The library, sign-in, dashboard and question-entry views are less direct evidence of the decision outputs.

The [composition script](../figures/source/compose_screenshots.py) crops the selected regions and adds the two labels. It keeps the genuine interface pixels and exports [PDF](../figures/rendered/fig7.pdf) and [PNG](../figures/rendered/fig7.png). The crops exclude profile headers, account identifiers, sign-in fields, navigation and unrelated passages. The two panels illustrate fictional demonstration data, and the benchmark records remain the source of measured results.
