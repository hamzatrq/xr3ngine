import React from "react";
import { connect } from 'react-redux';
import { selectUserState } from '../../../user/reducers/user/selector';
import Toast from './Toast';
// @ts-ignore
// @ts-ignore
import styles from "./toast.module.scss";

type Props = {
  user?: any;
}

const mapStateToProps = (state: any): any => {
  return {
    user: selectUserState(state),
  };
};

const UserToast = (props: Props) => {
  const messages = props.user?.get('toastMessages');
  const msgs = messages
    ? Array.from(messages).map((m: any) => {
      if (m.args.userAdded) return <span><span className={styles.userAdded}>{m.user.name}</span> joined</span>;
      else if (m.args.userRemoved) return <span><span className={styles.userRemoved}>{m.user.name}</span> left</span>;
    }) : [];


  return (
    <Toast
      messages={msgs}
      customClass={styles.userToastContainer}
    />
  );
};

export default connect(mapStateToProps)(UserToast);
