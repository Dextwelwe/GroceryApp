import { useAuth } from '../../providers/AuthProvider';
import '../grocery/grocery.css'
import HeaderMenu from '../../components/header/header';
import { useTranslation } from 'react-i18next';
import gr from './Groceries.module.css'

import iconLogout from '../../images/icons/logout.svg'
import Select from '../../components/select/Select';
import GroceryCard from '../../components/groceryCard/GroceryCard';

export default function Groceries() {
  const {userData} = useAuth();
  const { t } = useTranslation();
  const { logout } = useAuth();

   if (!userData) return null;

  let groceries = userData.getGroceries();
  const options = ['All', "Personal", "Shared"]
  const optionsStatus = ['All', "Active", "Completed"]
  const optionsSortBy = ['Newest First', "Oldest First", "A-Z", "Z-A"];
  const headerTitle = t('HI') + ", " + userData.firstName + " !";
  const headerItems =  [{src : iconLogout , alt : "Logout", clickaction : logout}]

  return (
       <div className='mainContentWrapper'>
        <HeaderMenu title={headerTitle} headerItems={headerItems} headerNav={null}/>
        <div className={gr.sortBy}>
          <Select label="Groceries" options={options} />
          <Select label="Status" options={optionsStatus} />
          <Select label="Sort By" options={optionsSortBy} />
        </div>
        <div className={gr.list}>
      {groceries.length > 0 && groceries.map((grocery, index) => (
        <GroceryCard key={index} data={grocery} />
      ))}
        </div>
      </div> 
  )
}
