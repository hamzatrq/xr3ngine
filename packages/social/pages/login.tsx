import { EmptyLayout } from '@xr3ngine/client-core/src/common/components/Layout/EmptyLayout';
import { doLoginAuto } from '@xr3ngine/client-core/src/user/reducers/auth/service';
import React, {useEffect} from 'react';
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import ProfileMenu from "@xr3ngine/client-core/src/user/components/UserMenu/menus/ProfileMenu";
import { useTranslation } from 'react-i18next';

interface Props {
    doLoginAuto?: any;
}

const mapStateToProps = (state: any): any => {
    return {
    };
};

const mapDispatchToProps = (dispatch: Dispatch): any => ({
    doLoginAuto: bindActionCreators(doLoginAuto, dispatch)
});

export const IndexPage = (props: Props): any => {
//   const {
//     doLoginAuto
//   } = props;
  const { t } = useTranslation();

    // useEffect(() => {
    //     doLoginAuto(true);
    // }, []);

  // <Button className="right-bottom" variant="contained" color="secondary" aria-label="scene" onClick={(e) => { setSceneVisible(!sceneIsVisible); e.currentTarget.blur(); }}>scene</Button>

  return(
      <EmptyLayout pageTitle={t('login.pageTitle')}>
          <style> {`
                [class*=menuPanel] {
                    top: 75px;
                    bottom: initial;
                }
            `}</style>
          <ProfileMenu/>
      </EmptyLayout>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(IndexPage);

