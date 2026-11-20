# Free academic tools audit

Reviewed the supplied repositories on 20 November 2026. The public GitHub metadata reported all five as non-archived. Installs are under the ignored research-only templates/writing-tools folder. No application dependencies were changed.

| Tool | License and Windows requirements | Decision |
|---|---|---|
| [Vale](https://github.com/vale-cli/vale) | MIT. Standalone Windows x64 release with no additional language runtime. The supplied errata-ai URL redirects to this repository. | Ran 3.28.1 with its built-in Vale style and local config. The archive hash matched GitHub release metadata. No downloaded style packs. Windows denied the binary in the sandbox, so the verified binary was run through the approved local execution path. |
| [LanguageTool](https://github.com/languagetool-org/languagetool) | Repository metadata lists LGPL-2.1. The standalone Java installation runs locally on Windows. Its source build needs Java 17 and Maven. | Evaluated. No Java runtime was available on PATH, and adding a Java distribution and dictionaries duplicated the available local proofing workflow. |
| [Proselint](https://pypi.org/project/proselint/0.16.0/) | BSD-3-Clause upstream ([GitHub mirror](https://github.com/amperser/proselint)). Python 3.10+, with Google RE2 and type stubs. | Ran 0.16.0 in a private Python 3.12 virtual environment. Installed wheels only, including google-re2 1.1.20251105 and google-re2-stubs 0.1.1. |
| [AEGIS Academic Integrity](https://github.com/sunilgentyala/aegis-integrity) | AGPL-3.0. Python package and optional ML stack. Full dependencies include PyMuPDF, NLP packages and optional model weights. Optional citation checks can send citation metadata to external registries. | Evaluated. Its extra detectors, models and metadata calls were unnecessary for this local comparison. Its automated venue checks do not resolve SMARTCOM and LNNS precedence. |
| [Noplag Engine](https://github.com/NoplagLabs/noplag-engine) | Apache-2.0. Python 3.12+, bundled API and PostgreSQL stack. It searches the corpus supplied to it. | Evaluated. Starting a service and database was unnecessary for a 14-document local corpus, so a small offline comparison program was used instead. |

Free local execution used Vale, Proselint, Python and the existing PDF extraction library. Public tool releases, metadata and papers were downloaded. Manuscript linting and comparison were local. No paid subscription, API purchase or detector run was performed.
