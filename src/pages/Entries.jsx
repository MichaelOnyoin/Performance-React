import { useEffect, useState } from 'react';
import { api, downloadFile } from '../api';
import Status from '../components/Status';
import ImportEntries from '../components/ImportEntries';

const currentMonth=()=>{
    const now=new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
};

export default function Entries(){
    const[month,setMonth]=useState(currentMonth),
    [employee,setEmployee]=useState(''),
    [employees,setEmployees]=useState([]),
    [rows,setRows]=useState([]),
    [role,setRole]=useState(''),
    [error,setError]=useState(''),
    [loading,setLoading]=useState(false);

    useEffect(()=>{
        api('/api/auth/me')
        .then(async user=>
            {
                setRole(user.role);
                if(user.role!=='Employee')setEmployees(await api('/api/employees'))
                }
        ).catch(e=>setError(e.message))},
        []);

    async function load()
    {
        setLoading(true);
        setError('');
        try{
            let query=`?month=${month}`;
            if(employee)query+=`&employee_id=${employee}`;
            setRows(await api(`/api/entries${query}`))
        }catch(e){setError(e.message)}
        finally{setLoading(false)}}

    useEffect(()=>{if(role)load()},[role,month,employee]);

    async function saveReviewerEdits(row,actual,employeeComments){
        setError('');
        try{
            const updated = await api(`/api/entries/${row.id}/review-edit`,
                {
                method:'PATCH',
                body:JSON.stringify({actual:actual===''?null:Number(actual),
                employee_comments:employeeComments||null})});
                setRows(old=>old.map(item=>item.id===updated.id?{...item,...updated,can_review:item.can_review}:item));
                return {...updated,can_review:row.can_review}
            }catch(e){setError(e.message);
                return null
            }
        }
    async function saveAdminActual(row,actual){
        setError('');
        try{
            const updated=await api(`/api/admin/entries/${row.id}/actual`,{
                method:'PATCH',body:JSON.stringify({actual:actual===''?null:Number(actual)})
            });
            setRows(old=>old.map(item=>item.id===updated.id?{...item,...updated}:item));
            return true;
        }catch(e){setError(e.message);return false}
    }
    async function review(row,status,comments){
        setError('');
        if(status==='Rejected'&&!comments.trim()){
            setError('Add feedback before rejecting an entry.');
            return null
        }
        const feedback=role==='Supervisor'?{supervisor_comments:comments.trim()||null}:{partner_comments:comments.trim()||null};
        try{
            const updated = await api(`/api/entries/${row.id}/review`,{method:'PATCH',body:JSON.stringify({status,...feedback})});setRows(old=>old.map(item=>item.id===updated.id?{...item,...updated,can_review:false}:item));return updated}
        catch(e){setError(e.message);return null}
    }
    async function download(row){try{await downloadFile(`/api/entries/${row.id}/context`,row.context_filename||'supporting-document')}catch(e){setError(e.message)}}
    async function deleteEntry(row){
        const label=`Entry ${row.id} for ${row.employee_name||`employee ${row.employee_id}`} — ${row.kpi_name||`KPI ${row.kpi_id}`} (${row.month})`;
        if(!window.confirm(`Permanently delete ${label}? This also removes its proof document.`))return;
        setError('');
        try{await api(`/api/entries/${row.id}`,{method:'DELETE'});setRows(old=>old.filter(item=>item.id!==row.id))}
        catch(e){setError(e.message)}
    }
    const canFilter=['Admin','Partner','Manager','Supervisor'].includes(role);
    return <section>
        <div className="pagehead"><div><h1>KPI Entries</h1><p>Review employee submissions at your assigned approval stage.</p></div><div className="actions"><label>Month<input type="month" value={month.slice(0,7)} onChange={e=>e.target.value&&setMonth(`${e.target.value}-01`)}/></label>{canFilter&&<label>Employee<select value={employee} onChange={e=>setEmployee(e.target.value)}><option value="">{role==='Supervisor'?'All supervised employees':'All employees'}</option>{employees.map(person=><option key={person.id} value={person.id}>{person.name} (ID {person.id})</option>)}</select></label>}<button onClick={load}>Load</button></div></div>
        {role==='Admin'&&<ImportEntries month={month} employeeId={employee} onImported={load}/>}
        {error&&<div className="error">{error}</div>}
        {role==='Supervisor'&&<div className="notice">You can review submissions from employees assigned to you. After your approval, each entry moves to the Partner final review queue.</div>}
        {role==='Partner'&&<div className="notice">You can see all employee KPI entries. Only entries approved by a Supervisor are available for your final review.</div>}
        <div className="panel tablewrap entries-table-wrap">
            <table className="entries-table">
                <thead>
                    <tr><th>Entry ID</th>
                    <th>Employee ID</th>
                    <th>Employee name</th>
                    <th>KPI ID</th>
                    <th>Description</th>
                    <th>Target</th>
                    <th>Actual</th>
                    <th>Score</th>
                    <th>Employee comments</th>
                    <th>Proof document</th>
                    <th>Status</th>
                    <th>Supervisor feedback</th>
                    <th>Partner feedback</th>
                    <th>Review</th>
                    {role==='Admin'&&
                    <th>Action</th>}
                    </tr>
                </thead>
            <tbody>
                {loading?
                <tr>
                    <td colSpan={role==='Admin'?15:14}>Loading entries…</td>
                </tr>:rows.map(row=><ReviewRow key={row.id} row={row} role={role} review={review} saveReviewerEdits={saveReviewerEdits} saveAdminActual={saveAdminActual} download={download} deleteEntry={deleteEntry}/>)
                }
                {
                 !loading&&!rows.length&&
                 <tr><td colSpan={role==='Admin'?15:14}>No KPI entries found for the selected month.</td>
                 </tr>}
            </tbody>
        </table>
        </div>
    </section>
}

function ReviewRow({row,role,review,saveReviewerEdits,saveAdminActual,download,deleteEntry}){
    const[supervisorComments,setSupervisorComments]=useState(row.supervisor_comments||''),[partnerComments,setPartnerComments]=useState(row.partner_comments||'');
    const[actual,setActual]=useState(row.actual??''),[employeeComments,setEmployeeComments]=useState(row.employee_comments||'');
    const[busy,setBusy]=useState(false),editableForReview=Boolean(row.can_review),reviewComments=role==='Supervisor'?supervisorComments:partnerComments;
    useEffect(()=>{setSupervisorComments(row.supervisor_comments||'');setPartnerComments(row.partner_comments||'');setActual(row.actual??'');setEmployeeComments(row.employee_comments||'')},[row.id,row.status,row.actual,row.employee_comments,row.supervisor_comments,row.partner_comments]);
    async function saveEdits(){setBusy(true);try{return await saveReviewerEdits(row,actual,employeeComments)}finally{setBusy(false)}}
    async function saveAdminValue(){setBusy(true);try{await saveAdminActual(row,actual)}finally{setBusy(false)}}
    async function decide(status){setBusy(true);try{const edited=await saveReviewerEdits(row,actual,employeeComments);if(edited)await review({...row,...edited},status,reviewComments)}finally{setBusy(false)}}
    return <tr>
        <td>{row.id}</td><td>{row.employee_id}</td><td>{row.employee_name||'—'}</td><td>{row.kpi_id}</td><td className="entry-description">{row.kpi_name||'—'}</td><td>{row.target??'—'}</td>
        <td>{role==='Admin'?<div className="admin-actual-editor"><input aria-label={`Actual for entry ${row.id}`} className="review-actual-input" type="number" step="any" value={actual} disabled={busy} onChange={e=>setActual(e.target.value)}/><button className="secondary" type="button" disabled={busy||String(row.actual??'')===String(actual??'')} onClick={saveAdminValue}>{busy?'Saving…':'Save'}</button></div>:editableForReview?<input className="review-actual-input" type="number" step="any" value={actual} onChange={e=>setActual(e.target.value)}/>:row.actual??'—'}</td>
        <td>{row.final_score?.toFixed(2)??'—'}</td>
        <td>{editableForReview?<textarea className="review-comment-input" rows="2" value={employeeComments} onChange={e=>setEmployeeComments(e.target.value)} placeholder="Employee comments"/>:row.employee_comments||'—'}</td>
        <td className="entry-document-cell">{row.has_context?<><button className="secondary" type="button" onClick={()=>download(row)}>Download</button><small>{row.context_filename}</small></>:'—'}</td>
        <td><Status value={row.status}/></td>
        <td>{editableForReview&&role==='Supervisor'?<textarea className="review-comment-input" rows="2" value={supervisorComments} onChange={e=>setSupervisorComments(e.target.value)} placeholder="Required when rejecting"/>:row.supervisor_comments||'—'}</td>
        <td>{editableForReview&&role==='Partner'?<textarea className="review-comment-input" rows="2" value={partnerComments} onChange={e=>setPartnerComments(e.target.value)} placeholder="Required when rejecting"/>:row.partner_comments||'—'}</td>
        <td>{editableForReview?<div className="review-actions review-actions-stacked"><button className="secondary" disabled={busy} onClick={saveEdits}>Save edits</button><button disabled={busy||actual===''} onClick={()=>decide('Approved')}>{busy?'Saving…':role==='Supervisor'?'Approve and send to Partner':'Final approve'}</button><button className="secondary" disabled={busy||!reviewComments.trim()} onClick={()=>decide('Rejected')}>Reject</button></div>:row.status==='Submitted'?'Waiting for Supervisor':row.status==='Supervisor Approved'?'Waiting for Partner':'—'}</td>
        {role==='Admin'&&<td><button className="icon-delete" type="button" aria-label={`Delete KPI entry ${row.id}`} title="Delete KPI entry" onClick={()=>deleteEntry(row)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg></button></td>}
    </tr>
}
