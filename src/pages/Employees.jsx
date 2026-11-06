import{useEffect,useState}from'react';
import{api}from'../api';

const teamOptions=[
    {label:'HLB Jim Roberts',value:'HLB JIM ROBERTS'},
    {label:'Jim Roberts Consulting',value:'JIM ROBERTS CONSULTING'}
];
const serviceLineOptions=['Unassigned','Internal Audit','External Audit'];
const emptyForm={name:'',email:'',team:'',service_line:''};

export default function Employees(){
    const[rows,setRows]=useState([]),[supervisors,setSupervisors]=useState([]),[supervision,setSupervision]=useState([]),[draftSupervisor,setDraftSupervisor]=useState({}),[form,setForm]=useState(emptyForm),[error,setError]=useState(''),[message,setMessage]=useState(''),[isAdmin,setIsAdmin]=useState(false),[role,setRole]=useState(''),[loading,setLoading]=useState(true),[savingSupervisor,setSavingSupervisor]=useState(null),[deletingEmployee,setDeletingEmployee]=useState(null);
    async function load(){
        setLoading(true);
        try{
            const[user,employees]=await Promise.all([api('/api/auth/me'),api('/api/employees')]);
            setRole(user.role);setIsAdmin(user.role==='Admin');setRows(employees);
            if(user.role==='Admin'){
                const[users,links]=await Promise.all([api('/api/admin/users'),api('/api/admin/supervision')]);
                setSupervisors(users.filter(item=>item.is_active&&item.role==='Supervisor'));
                setSupervision(links);
                setDraftSupervisor(Object.fromEntries(links.map(item=>[item.employee_id,String(item.supervisor_user_id||'')])));
            }
        }catch(e){setError(e.message)}finally{setLoading(false)}
    }
    useEffect(()=>{load()},[]);
    async function add(event){
        event.preventDefault();setError('');setMessage('');
        try{
            await api('/api/employees',{method:'POST',body:JSON.stringify({...form,email:form.email||null})});
            setForm(emptyForm);setMessage('Employee added.');await load();
        }catch(e){setError(e.message)}
    }
    async function saveSupervisor(employee){
        setSavingSupervisor(employee.id);setError('');setMessage('');
        try{
            const result=await api(`/api/admin/employees/${employee.id}/supervisor`,{method:'PUT',body:JSON.stringify({supervisor_user_id:draftSupervisor[employee.id]?Number(draftSupervisor[employee.id]):null})});
            setSupervision(old=>old.map(item=>item.employee_id===employee.id?{...item,supervisor_user_id:result.supervisor_user_id,supervisor_name:result.supervisor_name||null}:item));
            setMessage(`Supervisor assignment saved for ${employee.name}.`);
        }catch(e){setError(e.message)}finally{setSavingSupervisor(null)}
    }
    async function removeEmployee(employee){
        if(!window.confirm(`Remove ${employee.name} from active employees? Their login will be removed, but all KPI assignments, entries, scores and proof documents will be preserved in the database.`))return;
        setDeletingEmployee(employee.id);setError('');setMessage('');
        try{await api(`/api/admin/employees/${employee.id}`,{method:'DELETE'});setRows(old=>old.filter(item=>item.id!==employee.id));setSupervision(old=>old.filter(item=>item.employee_id!==employee.id));setMessage(`${employee.name} was archived. Their KPI data remains unchanged.`)}
        catch(e){setError(e.message)}finally{setDeletingEmployee(null)}
    }
    return <section>
        <h1>Employees</h1>
        <p>Firm-wide employee master data.</p>
        {error&&<div className="error">{error}</div>}{message&&<div className="notice">{message}</div>}
        {(role==='Admin'||role==='Partner')&&<form className="panel formgrid" onSubmit={add}>
            <label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
            <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
            <label>Team<select required value={form.team} onChange={e=>setForm({...form,team:e.target.value})}><option value="">Select team</option>{teamOptions.map(team=><option key={team.value} value={team.value}>{team.label}</option>)}</select></label>
            <label>Service line<select required value={form.service_line} onChange={e=>setForm({...form,service_line:e.target.value})}><option value="">Select service line</option>{serviceLineOptions.map(option=><option key={option} value={option}>{option}</option>)}</select></label>
            <button type="submit">Add employee</button>
        </form>}
        {isAdmin&&<div className="notice supervisor-assignment-hint">Assign a supervisor to every employee. Employees, supervisors and partners need an assigned supervisor before they can submit personal KPIs.{supervisors.length===0&&' There are no active Supervisor accounts yet; set a user role to Supervisor on the Users page first.'}</div>}
        <div className="panel tablewrap">
            <table>
                <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Service line</th>{isAdmin&&<th>Supervisor assignment</th>}{isAdmin&&<th>Action</th>}</tr></thead>
                <tbody>{loading?<tr><td colSpan={isAdmin?6:4}>Loading employees…</td></tr>:rows.map(employee=>{
                    const assigned=supervision.find(item=>item.employee_id===employee.id);
                    return <tr key={employee.id}>
                        <td>{employee.name}</td><td>{employee.email||'—'}</td><td>{employee.team}</td><td>{employee.service_line}</td>
                        {isAdmin&&<td><div className="supervisor-assignment-control"><select aria-label={`Supervisor for ${employee.name}`} value={draftSupervisor[employee.id]??''} onChange={e=>setDraftSupervisor(old=>({...old,[employee.id]:e.target.value}))}><option value="">No supervisor assigned</option>{supervisors.map(person=><option key={person.id} value={person.id}>{person.full_name}</option>)}</select><button className="secondary" disabled={savingSupervisor===employee.id||String(draftSupervisor[employee.id]||'')===String(assigned?.supervisor_user_id||'')} onClick={()=>saveSupervisor(employee)}>{savingSupervisor===employee.id?'Saving…':'Save'}</button></div></td>}
                        {isAdmin&&<td><button className="icon-delete" type="button" aria-label={`Archive employee ${employee.name}`} title={deletingEmployee===employee.id?'Archiving employee…':'Archive employee'} disabled={deletingEmployee===employee.id} onClick={()=>removeEmployee(employee)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg></button></td>}
                    </tr>;
                })}{!loading&&!rows.length&&<tr><td colSpan={isAdmin?6:4}>No employees found.</td></tr>}</tbody>
            </table>
        </div>
    </section>
}
