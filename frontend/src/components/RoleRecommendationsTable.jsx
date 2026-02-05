import { useState } from "react";
import { Table, Badge, Button, Collapse } from "react-bootstrap";

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function joinNames(arr, limit = 10) {
  const names = (arr || []).map((x) => x?.name).filter(Boolean);
  if (!names.length) return "";
  const clipped = names.slice(0, limit);
  return clipped.join(", ") + (names.length > limit ? "..." : "");
}

export default function RoleRecommendationsTable({
  items,
  emptyText = "No recommendations to show.",
}) {
  const [openRoleId, setOpenRoleId] = useState(null);

  function toggle(roleId) {
    setOpenRoleId((prev) => (prev === roleId ? null : roleId));
  }

  if (!items || items.length === 0) {
    return (
      <div className="mt-3 text-muted" style={{ fontSize: 13 }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <Table responsive hover className="mb-0">
        <thead>
          <tr>
            <th style={{ width: 120 }}>Competency</th>
            <th style={{ width: 110 }}>Bonus</th>
            <th style={{ width: 110 }}>Final</th>
            <th>Role</th>
            <th style={{ width: 160 }}>Details</th>
          </tr>
        </thead>

        <tbody>
          {items.map((r) => {
            const competency = safeNum(r.competency_score);
            const bonus = safeNum(r.preference_bonus);
            const finalScore = safeNum(r.final_score);

            const isOpen = openRoleId === r.role_id;
            const exp = r.explanation || null;

            const matched = exp?.summary?.matched_count ?? exp?.matched?.length ?? 0;
            const partial = exp?.summary?.partial_count ?? exp?.partial?.length ?? 0;
            const missing = exp?.summary?.missing_count ?? exp?.missing?.length ?? 0;

            const pref = exp?.preference || null;
            const isPreferredRole = pref?.is_preferred_role ? true : false;
            const techOverlapCount = safeNum(pref?.tech_overlap_count);

            const missingText = joinNames(exp?.missing, 12);

            return (
              <tr key={r.role_id}>
                <td>
                  <Badge bg="info">{competency.toFixed(1)}</Badge>
                </td>
                <td>
                  <Badge bg={bonus > 0 ? "success" : "secondary"}>
                    {bonus.toFixed(1)}
                  </Badge>
                </td>
                <td>
                  <Badge bg="warning" text="dark">
                    {finalScore.toFixed(1)}
                  </Badge>
                </td>

                <td>
                  <div style={{ fontWeight: 650 }}>{r.title}</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    {r.description || "No description yet."}
                  </div>

                  <Collapse in={isOpen}>
                    <div className="mt-3">
                      <div className="d-flex gap-2 flex-wrap mb-2">
                        <Badge bg="success">Matched: {matched}</Badge>
                        <Badge bg="warning" text="dark">
                          Partial: {partial}
                        </Badge>
                        <Badge bg="danger">Missing: {missing}</Badge>
                        {isPreferredRole ? <Badge bg="primary">Preferred role</Badge> : null}
                        {techOverlapCount > 0 ? (
                          <Badge bg="primary">Tech overlap: {techOverlapCount}</Badge>
                        ) : null}
                      </div>

                      <div className="text-muted" style={{ fontSize: 13 }}>
                        Competency is based on required skills vs your saved skills. Bonus is a capped
                        tie-breaker using preferred roles and preferred technologies.
                      </div>

                      {missingText ? (
                        <div className="mt-2">
                          <div style={{ fontWeight: 650, fontSize: 13 }}>Missing skills</div>
                          <div className="text-muted" style={{ fontSize: 13 }}>
                            {missingText}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Collapse>
                </td>

                <td>
                  <Button variant="outline-light" onClick={() => toggle(r.role_id)}>
                    {isOpen ? "Hide" : "Show"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
