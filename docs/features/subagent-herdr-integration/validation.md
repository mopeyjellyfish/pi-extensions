# Herdr Supervisor Rail validation

## Target

Accepted direction: `design/direction-a-supervisor-rail.png`.

Native evidence used `herdr pane layout` and `herdr pane read`. Browser and screenshot validation do not apply to raw terminal panes.

## Mismatch ledger

| Area               | Accepted target                                               | Native evidence                                                                                                                          | Result                       | Follow-up                                                    |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| Hierarchy          | Main Pi pane on the left; child rail on the right             | A 188-column tab produced a 113-column main pane and a 75-column rail                                                                    | Match                        | None                                                         |
| Focus              | New child panes do not take focus                             | `focused_pane_id` remained the main Pi pane for direct, workflow, and post-reload launches                                               | Match                        | None                                                         |
| One child          | One readable full-height rail pane                            | One child used the full 75-by-61 rail                                                                                                    | Match                        | None                                                         |
| Multiple children  | Children stack in the right rail                              | Two children used 75-by-31 and 75-by-30 panes; three and more children stayed in the same rail                                           | Match                        | None                                                         |
| Overflow           | More than three retained children remain reachable            | Additional children stayed in the right split. Native pane focus, zoom, and scrollback remain available when retained panes become short | Acceptable terminal behavior | Users can close retained panes when they no longer need them |
| Transcript         | Full child transcript, not only the final answer              | `herdr pane read` showed the user task, tool call, tool result, assistant result, and complete child session                             | Match                        | None                                                         |
| State              | Running and terminal state are explicit                       | A foreground pane changed from `RUNNING` to `COMPLETE`; descriptors changed from text feed to `session-jsonl`                            | Match                        | None                                                         |
| Reload             | Owned panes survive idle `/reload`                            | The first completed pane remained. A second post-reload foreground run opened below it and reached `COMPLETE`                            | Match                        | None                                                         |
| Control capability | Reload does not keep stale or foreign control authority       | Native reload rotated the retained pane token; foreground `:stop` returned `Unsupported`; focused tests reject foreign target fields     | Match                        | None                                                         |
| Dismissal          | Closing a pane does not affect its run                        | Manual pane closure left the upstream run and status unchanged during acceptance                                                         | Match                        | None                                                         |
| Shutdown           | Parent shutdown removes only owned panes                      | Earlier native shutdown acceptance closed the owned rail and kept unrelated panes                                                        | Match                        | None                                                         |
| Parent loss        | Orphan viewers do not remain interactive                      | A focused viewer test removes owner liveness and observes a bounded terminal close message                                               | Match                        | None                                                         |
| Styling            | Raw terminal output follows the accepted calm state hierarchy | Package-owned ANSI state labels lead plain transcript text; no browser decoration was added                                              | Match for terminal surface   | None                                                         |

## Recheck targets

- Recheck the 60/40 main-to-rail split if Herdr changes split ratio semantics.
- Recheck foreground terminal reconciliation if Pi changes `sessionManager.getBranch()` tool-result details.
- Recheck control rebinding if `pi-subagents` changes its versioned control-channel contract.

No blocking visual or interaction mismatch remains.
