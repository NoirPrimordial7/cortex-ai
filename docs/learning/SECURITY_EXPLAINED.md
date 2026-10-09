# Permissions explained with a fictional example

![Permission boundary](../diagrams/04-auth-permissions.svg)

Authentication is checking that Maya signed in. Authorization is checking whether Maya may read a particular policy. A role gives permission to perform tasks; a document grant gives access to that document. An employee may ask questions without being allowed to read executive information.

For a restricted-document question, the backend searches only allowed evidence. It does not pass the restricted text to an AI and then ask the AI to hide it. It also avoids showing the hidden title or saying that a restricted document exists. The safe answer is simply that available approved evidence is insufficient.

Revocation means removing an access grant. New queries, citations and saved answers must check current grants. Text someone already downloaded cannot be erased. Historical dates do not restore old access rights. All these behaviors require implementation tests; the design is not a proof of perfect security.
