import { AlertCircle, FileText } from "lucide-react";
import { PYRAMID, findClub } from "../../data/pyramid.js";
import { fmtK } from "../../lib/format.js";
import {
  effectiveWageCap,
  capHeadroom,
  annualWageBill,
} from "../../lib/finance/engine.js";
import { applyRenewal, applyRenewalRejection, canAffordRenewal } from "../../lib/finance/contracts.js";
import {
  applyStaffRenewalAccept,
  applyStaffRenewalReject,
  canAffordStaffRenewal,
} from "../../lib/staffRenewals.js";
import {
  ensureCareerBoard,
  applyMemberConfidenceDelta,
  recalcBoardConfidence,
} from "../../lib/board.js";
import { css, RatingDot, Stat } from "../../components/primitives.jsx";

export function StaffRenewalsPanel({ career, updateCareer, leagueTier, showHeading = true }) {
  const queue = (career.pendingStaffRenewals || []).filter((r) => !r._handled);
  const closed = career.renewalsClosed;
  const accept = (proposal) => {
    if (closed) return;
    if (!canAffordStaffRenewal(career, proposal)) {
      updateCareer({
        news: [{
          week: career.week,
          type: 'loss',
          text: `⚖️ Cannot renew ${proposal.name} — club cash is too tight for this pay rise (staff wages sit outside the player cap but still hit the bank).`,
        }, ...(career.news || [])].slice(0, 25),
      });
      return;
    }
    const patch = applyStaffRenewalAccept(career, proposal);
    updateCareer({
      ...patch,
      pendingStaffRenewals: (career.pendingStaffRenewals || []).map((r) =>
        r.staffId === proposal.staffId ? { ...r, _handled: 'accepted' } : r,
      ),
      news: [{ week: career.week, type: 'win', text: `✍️ Staff: re-signed ${proposal.name} (${proposal.role}) for ${proposal.proposedYears}y` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const reject = (proposal) => {
    if (closed) return;
    const patch = applyStaffRenewalReject(career, proposal, leagueTier);
    updateCareer({
      ...patch,
      pendingStaffRenewals: (career.pendingStaffRenewals || []).map((r) =>
        r.staffId === proposal.staffId ? { ...r, _handled: 'rejected' } : r,
      ),
      news: [{ week: career.week, type: 'info', text: `🔄 New ${proposal.role} hired in place of ${proposal.name}.` }, ...(career.news || [])].slice(0, 25),
    });
  };
  if (queue.length === 0) return null;
  return (
    <div className="space-y-3">
      {showHeading && <div className={`${css.h1} text-2xl`}>STAFF RENEWALS</div>}
      {closed && (
        <div className={`${css.panel} p-3 text-[11px] text-atext-dim`} style={{ borderColor: '#FFB347' }}>
          Renewal window closed for this season — finish these in pre-season next year, or they were auto-filled when the season started.
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        {queue.map((r) => {
          const canAfford = canAffordStaffRenewal(career, r);
          return (
            <div key={r.staffId} className={`${css.panel} p-4`}>
              <div className="font-bold text-base">{r.name}</div>
              <div className="text-[10px] text-atext-dim uppercase tracking-widest font-mono mb-2">{r.role}{r.volunteer ? ' · volunteer' : ''}</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                <div className="text-atext-mute">Demand</div>
                <div className="text-right font-mono font-bold">{r.volunteer ? 'Volunteer' : `${fmtK(r.proposedWage)}/yr`}</div>
                <div className="text-atext-mute">Years</div>
                <div className="text-right font-mono">{r.proposedYears}y</div>
              </div>
              {!r.volunteer && !canAfford && (
                <div className="text-[10px] text-[#E84A6F] mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Cash buffer too low for raise</div>
              )}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => reject(r)} disabled={closed} className={closed ? 'text-xs px-3 py-2 text-atext-mute' : 'text-xs px-3 py-2 rounded-lg text-[#E84A6F] hover:bg-[#E84A6F]/10'}>Replace</button>
                <button type="button" onClick={() => accept(r)} disabled={closed || !canAfford} className={!closed && canAfford ? `${css.btnPrimary} text-xs px-3 py-2` : 'px-3 py-2 rounded-lg text-xs bg-apanel-2 text-atext-mute'}>Re-Sign</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ContractsTab({ career, updateCareer }) {
  const leagueTier = PYRAMID[career.leagueKey]?.tier ?? 1;
  return (
    <div className="space-y-8">
      <div>
        <div className={`${css.h1} text-3xl`}>CONTRACTS</div>
        <div className="text-xs text-atext-dim max-w-2xl leading-relaxed">
          One place for cap-backed renewals. Player queue matches Squad → Renewals; staff sit below or under Club → Operations → Staff.
          In pre-season, resolve these before the first home-and-away round — the window locks when the season starts.
        </div>
      </div>
      <RenewalsTab career={career} updateCareer={updateCareer} />
      <StaffRenewalsPanel career={career} updateCareer={updateCareer} leagueTier={leagueTier} />
    </div>
  );
}

export function RenewalsTab({ career, updateCareer }) {
  const queue = (career.pendingRenewals || []).filter(r => !r._handled);
  const renewalsLeague = PYRAMID[career.leagueKey];
  const capLimit = effectiveWageCap(career);
  const wageBillAnnual = annualWageBill(career);
  const headroom = capHeadroom(career);
  const closed = career.renewalsClosed;
  const accept = (proposal) => {
    if (closed) return;
    if (!canAffordRenewal(career, proposal)) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot renew ${proposal.name} — would breach the salary cap` }, ...(career.news || [])].slice(0, 25),
      });
      return;
    }
    const patch = applyRenewal(career, proposal);
    const merged = JSON.parse(JSON.stringify({ ...career, ...patch }));
    ensureCareerBoard(merged, findClub(merged.clubId), renewalsLeague);
    const wageDelta = proposal.proposedWage - (proposal.currentWage ?? 0);
    if (wageDelta <= 0) {
      applyMemberConfidenceDelta(merged, "Football Director", 2);
      applyMemberConfidenceDelta(merged, "Finance Director", 1);
    } else if (wageDelta >= 40_000) {
      applyMemberConfidenceDelta(merged, "Finance Director", -2);
      applyMemberConfidenceDelta(merged, "Football Director", 1);
    } else {
      applyMemberConfidenceDelta(merged, "Chairman", 1);
    }
    recalcBoardConfidence(merged);
    updateCareer({
      ...patch,
      board: merged.board,
      finance: merged.finance,
      pendingRenewals: (career.pendingRenewals || []).map(r => r.playerId === proposal.playerId ? { ...r, _handled: 'accepted' } : r),
      news: [{ week: career.week, type: 'win', text: `✍️ Re-signed ${proposal.name} for ${proposal.proposedYears}y @ ${fmtK(proposal.proposedWage)}/yr` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const reject = (proposal) => {
    if (closed) return;
    const patch = applyRenewalRejection(career, proposal);
    updateCareer({
      ...patch,
      pendingRenewals: (career.pendingRenewals || []).map(r => r.playerId === proposal.playerId ? { ...r, _handled: 'rejected' } : r),
      news: [{ week: career.week, type: 'loss', text: `🚪 ${proposal.name} will walk at the end of pre-season` }, ...(career.news || [])].slice(0, 25),
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>CONTRACT RENEWALS</div>
          <div className="text-xs text-atext-dim max-w-xl leading-relaxed">
            Players on an expiring deal. Same maths as Club → Commercial → Contracts. Staff with expiring deals live under Operations → Staff or in Contracts.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Cap Headroom" value={fmtK(headroom)} accent={headroom > 0 ? '#4AE89A' : '#E84A6F'} />
          <Stat label="Outstanding" value={queue.length} accent="var(--A-accent-2)" />
        </div>
      </div>
      <div className={`${css.panel} p-4 grid sm:grid-cols-3 gap-3 text-[11px]`}>
        <div>
          <div className={css.label}>Annual wage bill</div>
          <div className="text-atext font-mono font-bold">${fmtK(wageBillAnnual)}</div>
        </div>
        <div>
          <div className={css.label}>Salary cap</div>
          <div className="text-atext font-mono font-bold">${fmtK(capLimit)}</div>
        </div>
        <div>
          <div className={css.label}>If you renew…</div>
          <div className="text-atext-dim leading-snug">Board reacts to wage discipline. Cap-smart deals please Football + Finance; big raises draw Treasury heat.</div>
        </div>
      </div>
      {closed && queue.length > 0 && (
        <div className={`${css.panel} p-3 text-[11px] text-[#FFB347]`} style={{ borderColor: '#FFB347' }}>
          The formal renewal window closed when the season began. Any unfinished deals here still count at year-end — use Squad → Renewals to review history.
        </div>
      )}
      {queue.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
          <div className="text-sm text-atext-dim">No active renewals. They&apos;ll appear at season end.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {queue.map(r => {
            const player = (career.squad || []).find(p => p.id === r.playerId);
            if (!player) return null;
            const wageDelta = r.proposedWage - (r.currentWage ?? 0);
            const canAfford = canAffordRenewal(career, r);
            const formColor = (player.form ?? 70) >= 80 ? '#4AE89A' : (player.form ?? 70) >= 60 ? 'var(--A-accent)' : '#E84A6F';
            return (
              <div key={r.playerId} className={`${css.panel} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-base">{r.name}</div>
                    <div className="text-[10px] text-atext-dim uppercase tracking-widest font-mono">{r.position} · age {r.age} · OVR {r.overall}</div>
                  </div>
                  <RatingDot value={r.overall} size="sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div className="text-atext-mute">Current</div>
                  <div className="text-atext text-right font-mono">{fmtK(r.currentWage)}/yr</div>
                  <div className="text-atext-mute">Demand</div>
                  <div className="text-right font-mono font-bold" style={{ color: wageDelta >= 0 ? '#FFB347' : '#4AE89A' }}>
                    {fmtK(r.proposedWage)}/yr <span className="text-atext-mute font-normal">({wageDelta >= 0 ? '+' : ''}{fmtK(wageDelta)})</span>
                  </div>
                  <div className="text-atext-mute">Years</div>
                  <div className="text-atext text-right font-mono">{r.proposedYears}y</div>
                  <div className="text-atext-mute">Form factor</div>
                  <div className="text-right font-mono" style={{ color: formColor }}>{(r.formMult ?? 1).toFixed(2)}×</div>
                </div>
                {!canAfford && (
                  <div className="text-[10px] text-[#E84A6F] mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Over salary cap</div>
                )}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => reject(r)} disabled={closed} className={closed ? 'text-xs px-3 py-2 text-atext-mute' : 'text-xs px-3 py-2 rounded-lg text-[#E84A6F] hover:bg-[#E84A6F]/10'}>Let Walk</button>
                  <button type="button" onClick={() => accept(r)} disabled={closed || !canAfford} className={canAfford && !closed ? `${css.btnPrimary} text-xs px-3 py-2` : "px-3 py-2 rounded-lg text-xs bg-apanel-2 text-atext-mute"}>Re-Sign</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
