const BASE= import.meta.env.VITE_API_URL||"http://127.0.0.1:8000";
export async function api(path, options={})
{
    const token=localStorage.getItem('token');
    const headers={...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers};
    const res= await fetch(`${BASE}${path}`,{...options,headers});
    if(res.status===401){localStorage.clear();location.href='/login';}
    if(!res.ok)
        {
            let detail='Request failed';
            try{
                detail=(await res.json()).detail||detail
            }
            catch{}
            throw new Error(detail)}return res.status===204?null:res.json()}
export async function login(email,password)
{
    const body=new URLSearchParams({username:email,password});
    const res=await fetch(
        `${BASE}/api/auth/token`,
        {
            method:'POST',
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            body
        }
    );
    if(!res.ok)throw new Error('Incorrect email or password');
    return res.json()
}