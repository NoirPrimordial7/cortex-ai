# Why these components exist

![Architecture](../diagrams/01-system-architecture.svg)

The frontend is the screen you use. The backend is the trusted gatekeeper; a user can modify browser requests, so the browser cannot decide permissions. The database stores users, reviewed policy metadata and evidence references. Private file storage retains original document versions. The retrieval module finds useful allowed passages. The reasoning module checks dates, authority and disagreement. The answerer returns supported evidence or declines safely.

We selected one local backend rather than several microservices because tomorrow's demonstration needs reliable integration. SQLite avoids installing a database server. Separate Python modules preserve clear responsibilities, so a better search engine or model can be added later without replacing permission checks. These are planning choices, not deployed components.

See [stack trade-offs](../planning/TECH_STACK.md); PostgreSQL, vectors and cloud hosting remain future changes requiring evidence and review.
